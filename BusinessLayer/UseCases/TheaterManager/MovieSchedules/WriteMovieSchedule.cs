using BusinessLayer.Dtos;
using BusinessLayer.Dtos.TheaterManager.MovieSchedules.Requests;
using BusinessLayer.Interfaces.IBehaviors;
using BusinessLayer.Services.Admin.Audit;
using BusinessLayer.Services.ApplicationServices;
using BusinessLayer.Services.IdentityAccess;
using DataAccess;
using DataAccess.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Shared.Enums;
using Shared.Exceptions;
using Shared.Localization;
using Hangfire;

namespace BusinessLayer.UseCases.TheaterManager.MovieSchedules;

public class WriteMovieSchedulesUseCase : IWriteBehavior<TheaterManagerAddMovieSchedulesRequest,
    TheaterManagerEditMovieSchedulesRequest, string>
{
    private readonly CinemaDbContext _cinemaDbContext;
    
    private readonly ILogger<WriteMovieSchedulesUseCase> _logger;
    
    private readonly IUserContextService _userContextService;
    
    private readonly IScheduleJobsService _scheduleJobsService;

    private readonly TheaterManagerValidate _theaterManagerValidate;
    private readonly AuditLogService _auditLogService;

    public WriteMovieSchedulesUseCase(CinemaDbContext cinemaDbContext , ILogger<WriteMovieSchedulesUseCase> logger ,
        IUserContextService userContextService , IScheduleJobsService scheduleJobsService ,
        TheaterManagerValidate theaterManagerValidate,
        AuditLogService auditLogService)
    {
        _cinemaDbContext = cinemaDbContext;
        _logger = logger;
        _userContextService = userContextService;
        _scheduleJobsService = scheduleJobsService;
        _theaterManagerValidate = theaterManagerValidate;
        _auditLogService = auditLogService;
    }
    public async Task<BaseResponse<string>> AddItem(TheaterManagerAddMovieSchedulesRequest request)
    {
        var getCurrentUserId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var isAuditoriumExist = await _cinemaDbContext.AuditoriumInfoEntities
            .AsNoTracking()
            .AnyAsync(x => x.AuditoriumId == request.AuditoriumId && 
                           (isAdmin || x.CinemaInfoEntity.TheaterManagerId == getCurrentUserId));
            
        if (!isAuditoriumExist)
        {
            throw new NotFoundException(Messages.Schedule.AuditoriumNotFound);
        }

        var cinemaId = await _cinemaDbContext.AuditoriumInfoEntities
            .Where(x => x.AuditoriumId == request.AuditoriumId)
            .Select(x => x.CinemaId)
            .FirstOrDefaultAsync();

        var transactions = await _cinemaDbContext.Database.BeginTransactionAsync();

        try
        {
            NormalizeSlotTimes(request.Slots);
            var reqMovieIds = request.Slots.Select(x => x.MovieId).Distinct().ToList();
            
            var validMovieDictionary = await _cinemaDbContext.MovieInfoEntity
                .AsNoTracking()
                .Where(m => reqMovieIds.Contains(m.MovieId) && m.IsActive && !m.IsDeleted)
                .ToDictionaryAsync(x => x.MovieId);

            var validMovieFormats = await _cinemaDbContext.MovieFormatMovieInfoEntity
                .AsNoTracking()
                .Where(y => reqMovieIds.Contains(y.MovieId))
                .GroupBy(x => x.MovieId)
                .ToDictionaryAsync(x => x.Key, y => y.Select(f => f.FormatId).ToList());

            var allFormats = await _cinemaDbContext.Set<MovieFormatInfoEntity>()
                .AsNoTracking()
                .ToDictionaryAsync(x => x.MovieFormatId, x => x.MovieFormatName);

            // Kiểm tra phim đã được ủy quyền tại rạp chưa
            var authorizedMovies = await _cinemaDbContext.MovieCinemaEntities
                .AsNoTracking()
                .Where(x => x.CinemaId == cinemaId && reqMovieIds.Contains(x.MovieId))
                .Select(x => x.MovieId)
                .ToListAsync();

            var proposedSlots = new List<MovieScheduleInfoEntity>();

            // Fetch existing schedules to skip duplicates
            var existingMatchSchedules = await _cinemaDbContext.MovieScheduleInfoEntity
                .AsNoTracking()
                .Where(x => x.AuditoriumId == request.AuditoriumId && !x.IsDeleted)
                .ToListAsync();

            foreach (var slot in request.Slots)
            {
                // check for exact match to skip
                var isAlreadyExist = existingMatchSchedules.Any(x => 
                    x.MovieId == slot.MovieId && 
                    x.MovieFormatId == slot.FormatId && 
                    x.StartTime == slot.StartedDate);
                
                if (isAlreadyExist) continue;

                if (!validMovieDictionary.TryGetValue(slot.MovieId, out var movie))
                {
                    throw new BadRequestException(Messages.Movie.IdNotExistOrInactive(slot.MovieId), "E01");
                }

                if (!authorizedMovies.Contains(slot.MovieId))
                {
                    throw new BadRequestException($"Phim '{movie.MovieName}' chưa được ủy quyền chiếu tại rạp này.", "E01");
                }

                if (!validMovieFormats.TryGetValue(slot.MovieId, out var movieFormat) || !movieFormat.Contains(slot.FormatId))
                {
                    var formatName = allFormats.TryGetValue(slot.FormatId, out var name) ? name : slot.FormatId.ToString();
                    throw new BadRequestException(Messages.MovieFormat.InvalidFormatForMovie(movie.MovieName, formatName), "E01");
                }

                if (slot.StartedDate < DateTime.UtcNow)
                {
                    throw new BadRequestException(Messages.Schedule.PastDateNotAllowed, "E01");
                }

                if (slot.StartedDate < movie.ActiveAt || slot.StartedDate.Date > movie.EndedDate.Date)
                {
                    throw new BadRequestException(Messages.Schedule.MovieAvailability(movie.MovieName, movie.ActiveAt.ToString("MM/dd/yyyy"), movie.EndedDate.ToString("MM/dd/yyyy")), "E01");
                }

                var endTime = slot.StartedDate.AddMinutes(movie.MovieDuration);

                proposedSlots.Add(new MovieScheduleInfoEntity
                {
                    MovieScheduleInfoId = Guid.NewGuid(),
                    MovieId = slot.MovieId,
                    AuditoriumId = request.AuditoriumId,
                    MovieFormatId = slot.FormatId,
                    ActiveAt = slot.StartedDate,
                    StartTime = slot.StartedDate,
                    EndedTime = endTime,
                    CreatedByUserId = getCurrentUserId,
                    IsActive = DateTime.UtcNow >= slot.StartedDate && DateTime.UtcNow < endTime,
                });
            }

            if (!proposedSlots.Any())
            {
                return new BaseResponse<string>()
                {
                    Message = "No new schedules to add.",
                    Data = null,
                    IsSuccess = true
                };
            }

            var sortedProposedSlots = proposedSlots.OrderBy(x => x.ActiveAt).ToList();
            
            for (int i = 0; i < sortedProposedSlots.Count - 1; i++)
            {
                if (sortedProposedSlots[i].EndedTime.AddMinutes(15) > sortedProposedSlots[i + 1].ActiveAt)
                {
                    throw new BadRequestException("Phải có khoảng trống 15 phút giữa 2 lịch chiếu để dọn dẹp phòng rạp.", "E02");
                }
            }

            var minStartTime = sortedProposedSlots.First().ActiveAt;
            var maxEndTime = sortedProposedSlots.Last().EndedTime.AddMinutes(15);

            var existingSchedules = await _cinemaDbContext.MovieScheduleInfoEntity
                .AsNoTracking()
                .Where(x => x.AuditoriumId == request.AuditoriumId 
                         && x.EndedTime.AddMinutes(15) > minStartTime 
                         && x.ActiveAt < maxEndTime
                         && !x.IsDeleted)
                .ToListAsync();

            foreach (var newSlot in proposedSlots)
            {
                var hasConflict = existingSchedules.Any(existing => 
                    newSlot.ActiveAt < existing.EndedTime.AddMinutes(15) && existing.ActiveAt < newSlot.EndedTime.AddMinutes(15));

                if (hasConflict)
                {
                    throw new BadRequestException("Bị trùng lịch với một suất chiếu khác (Chưa tính 15 phút dọn dẹp).", "E02");
                }
            }

            await _cinemaDbContext.MovieScheduleInfoEntity.AddRangeAsync(proposedSlots);
            await _auditLogService.WriteAsync(
                "Create",
                "MovieSchedule",
                request.AuditoriumId,
                $"Auditorium {request.AuditoriumId}",
                $"Created {proposedSlots.Count} movie schedule(s).",
                cinemaId);
            await _cinemaDbContext.SaveChangesAsync();
            await transactions.CommitAsync();

            foreach (var slot in proposedSlots)
            {
                BackgroundJob.Enqueue<IScheduleJobsService>(s => s.AddJobIntoBackground(SchedulesJobCategoryEnums.Schedules, slot.MovieScheduleInfoId, slot.ActiveAt, slot.EndedTime));
            }

            return new BaseResponse<string>()
            {
                Message = Messages.Schedule.CreateCompleted,
                Data = null,
                IsSuccess = true
            };
        }
        catch (Exception ex)
        {
            await transactions.RollbackAsync();
            
            if (ex is AppException) throw;

            _logger.LogError(ex, "Error creating movie schedule");
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    public async Task<BaseResponse<string>> UpdateItem(Guid auditoriumId, TheaterManagerEditMovieSchedulesRequest request)
    {
        // Checking
        if(request.Slots != null && request.Slots.Any())
        {
            foreach(var slot in request.Slots)
            {
                if (_theaterManagerValidate.ValidateSchedule(slot.ScheduleId))
                {
                    throw new BadRequestException("Throw Error Here", "E01");
                }
            }
        }
        var getCurrentUserId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var isAuditoriumExist = await _cinemaDbContext.AuditoriumInfoEntities
            .AsNoTracking()
            .AnyAsync(x => x.AuditoriumId == auditoriumId && 
                           (isAdmin || x.CinemaInfoEntity.TheaterManagerId == getCurrentUserId || 
                            x.CinemaInfoEntity.FacilitiesManagerId == getCurrentUserId));

        if (!isAuditoriumExist)
        {
            throw new NotFoundException(Messages.Schedule.AuditoriumNotFound);
        }

        var cinemaId = await _cinemaDbContext.AuditoriumInfoEntities
            .Where(x => x.AuditoriumId == auditoriumId)
            .Select(x => x.CinemaId)
            .FirstOrDefaultAsync();

        if (request.Slots == null || !request.Slots.Any())
        {
            throw new BadRequestException(Messages.Schedule.ScheduleListCannotBeEmpty, "E01");
        }

        var transactions = await _cinemaDbContext.Database.BeginTransactionAsync();

        try
        {
            NormalizeSlotTimes(request.Slots);
            var updatingScheduleIds = request.Slots.Select(s => s.ScheduleId).ToList();
            var movieNames = await _cinemaDbContext.MovieScheduleInfoEntity
                .Where(x => updatingScheduleIds.Contains(x.MovieScheduleInfoId)) 
                .Select(x => x.MovieInfoEntity.MovieName)
                .Distinct()
                .ToListAsync();
            var schedulesToUpdate = await _cinemaDbContext.MovieScheduleInfoEntity
                .Where(x => x.AuditoriumId == auditoriumId && updatingScheduleIds.Contains(x.MovieScheduleInfoId) && !x.IsDeleted)
                .ToListAsync();

            if (schedulesToUpdate.Count != updatingScheduleIds.Count)
            {
                throw new BadRequestException(Messages.Schedule.SchedulesIsNotFoundOrMovieIsInactivated, "E01");
            }

            var hasSuccessfulBookingOnUpdatingSchedules = await _cinemaDbContext.Set<DataAccess.Entities.UserInfos.OrderDetailsInfo>()
                .AnyAsync(od => updatingScheduleIds.Contains(od.MovieScheduleId) &&
                                od.OrderInfoEntity.OrderStatus == Shared.Enums.OrderStatusEnum.Booked);

            if (hasSuccessfulBookingOnUpdatingSchedules)
            {
                throw new BadRequestException("Không thể sửa các suất chiếu đã có người đặt vé thành công.", "E03");
            }

            var movieIdsToCheck = request.Slots.Select(s => s.MovieId).Distinct().ToList();

            var moviesInfos = await _cinemaDbContext.MovieInfoEntity
                .AsNoTracking()
                .Where(x => movieIdsToCheck.Contains(x.MovieId) && x.IsActive && !x.IsDeleted)
                .ToDictionaryAsync(m => m.MovieId);

            var findMoviesSupportedFormat = await _cinemaDbContext.MovieFormatMovieInfoEntity
                .AsNoTracking()
                .Where(x => movieIdsToCheck.Contains(x.MovieId))
                .GroupBy(x => x.MovieId)
                .ToDictionaryAsync(m => m.Key, f => f.Select(x => x.FormatId).ToList());

            var allFormats = await _cinemaDbContext.Set<MovieFormatInfoEntity>()
                .AsNoTracking()
                .ToDictionaryAsync(x => x.MovieFormatId, x => x.MovieFormatName);

            // Kiểm tra phim đã được ủy quyền tại rạp chưa
            var authorizedMovies = await _cinemaDbContext.MovieCinemaEntities
                .AsNoTracking()
                .Where(x => x.CinemaId == cinemaId && movieIdsToCheck.Contains(x.MovieId))
                .Select(x => x.MovieId)
                .ToListAsync();

            var proposedSlots = new List<MovieScheduleInfoEntity>();

            foreach (var slot in request.Slots)
            {
                var existingEntity = schedulesToUpdate.FirstOrDefault(x => x.MovieScheduleInfoId == slot.ScheduleId);
                var isUnchanged = existingEntity != null && 
                                  existingEntity.MovieId == slot.MovieId && 
                                  existingEntity.MovieFormatId == slot.FormatId && 
                                  existingEntity.StartTime == slot.StartedDate;

                if (!isUnchanged)
                {
                    if (!moviesInfos.TryGetValue(slot.MovieId, out var movie))
                    {
                        throw new BadRequestException(Messages.Movie.IdNotExistOrInactive(slot.MovieId), "E01");
                    }

                    if (!authorizedMovies.Contains(slot.MovieId))
                    {
                        throw new BadRequestException($"Phim '{movie.MovieName}' chưa được ủy quyền chiếu tại rạp này.", "E01");
                    }

                    if (!findMoviesSupportedFormat.TryGetValue(slot.MovieId, out var movieFormat) || !movieFormat.Contains(slot.FormatId))
                    {
                        var formatName = allFormats.TryGetValue(slot.FormatId, out var name) ? name : slot.FormatId.ToString();
                        throw new BadRequestException(Messages.MovieFormat.InvalidFormatForMovie(movie.MovieName, formatName), "E01");
                    }

                    if (slot.StartedDate < DateTime.UtcNow)
                    {
                        throw new BadRequestException(Messages.Schedule.PastDateNotAllowed, "E01");
                    }

                    if (slot.StartedDate < movie.ActiveAt || slot.StartedDate.Date > movie.EndedDate.Date)
                    {
                        throw new BadRequestException(Messages.Schedule.MovieAvailability(movie.MovieName, movie.ActiveAt.ToString("MM/dd/yyyy"), movie.EndedDate.ToString("MM/dd/yyyy")), "E01");
                    }
                }

                var targetMovieForDuration = moviesInfos[slot.MovieId];
                var endTime = slot.StartedDate.AddMinutes(targetMovieForDuration.MovieDuration);

                proposedSlots.Add(new MovieScheduleInfoEntity
                {
                    MovieScheduleInfoId = slot.ScheduleId, 
                    ActiveAt = slot.StartedDate,
                    EndedTime = endTime
                });
            }

            var sortedProposedSlots = proposedSlots.OrderBy(x => x.ActiveAt).ToList();
            
            for (int i = 0; i < sortedProposedSlots.Count - 1; i++)
            {
                if (sortedProposedSlots[i].EndedTime.AddMinutes(15) > sortedProposedSlots[i + 1].ActiveAt)
                {
                    throw new BadRequestException("Phải có khoảng trống 15 phút giữa 2 lịch chiếu để dọn dẹp phòng rạp.", "E02");
                }
            }

            var minStartTime = sortedProposedSlots.First().ActiveAt;
            var maxEndTime = sortedProposedSlots.Last().EndedTime.AddMinutes(15);

            var existingDbSchedules = await _cinemaDbContext.MovieScheduleInfoEntity
                .AsNoTracking()
                .Where(x => x.AuditoriumId == auditoriumId 
                         && x.EndedTime.AddMinutes(15) > minStartTime 
                         && x.ActiveAt < maxEndTime
                         && !x.IsDeleted
                         && !updatingScheduleIds.Contains(x.MovieScheduleInfoId)) 
                .ToListAsync();

            foreach (var newSlot in proposedSlots)
            {
                var hasConflict = existingDbSchedules.Any(existing => 
                    newSlot.ActiveAt < existing.EndedTime.AddMinutes(15) && existing.ActiveAt < newSlot.EndedTime.AddMinutes(15));

                if (hasConflict)
                {
                    throw new BadRequestException("Bị trùng lịch với một suất chiếu khác (Chưa tính 15 phút dọn dẹp).", "E02");
                }
            }

            foreach (var slot in request.Slots)
            {
                var entity = schedulesToUpdate.First(x => x.MovieScheduleInfoId == slot.ScheduleId);
                var movie = moviesInfos[slot.MovieId];

                entity.MovieId = slot.MovieId;
                entity.MovieFormatId = slot.FormatId;
                entity.ActiveAt = slot.StartedDate;
                entity.StartTime = slot.StartedDate;
                entity.EndedTime = slot.StartedDate.AddMinutes(movie.MovieDuration);
                entity.UpdatedByUserId = getCurrentUserId;
                entity.UpdatedAt = DateTime.UtcNow;
            }

            await _auditLogService.WriteAsync(
                "Update",
                "MovieSchedule",
                auditoriumId,
                $"Auditorium {auditoriumId}",
                $"Updated {request.Slots.Count} movie schedule(s).",
                cinemaId);

            await _cinemaDbContext.SaveChangesAsync();
            await transactions.CommitAsync();

            foreach (var slot in request.Slots)
            {
                var movie = moviesInfos[slot.MovieId];
                BackgroundJob.Enqueue<IScheduleJobsService>(s => s.UpdatedJobIntoBackground(SchedulesJobCategoryEnums.Schedules, slot.ScheduleId, slot.StartedDate, slot.StartedDate.AddMinutes(movie.MovieDuration)));
            }

            return new BaseResponse<string>()
            {
                Message = "Add Results Here",
                Data = null,
                IsSuccess = true
            };
        }
        catch (Exception ex)
        {
            await transactions.RollbackAsync();

            if (ex is AppException) throw;

            _logger.LogError(ex, "Error updating movie schedule");
            throw CustomSystemException.SystemExceptionCaller();
        }
    }


    public async Task<BaseResponse<string>> DeleteItem(Guid itemId)
    {
        var getCurrentUserId = _userContextService.GetUserId();
        var schedule = await _cinemaDbContext.MovieScheduleInfoEntity
            .Include(x => x.AuditoriumInfoEntities)
            .Include(x => x.MovieInfoEntity)
            .FirstOrDefaultAsync(x => x.MovieScheduleInfoId == itemId);
            
        if (schedule == null)
        {
            throw new NotFoundException(Messages.Schedule.SchedulesIsNotFoundOrMovieIsInactivated);
        }

        if (schedule.IsDeleted)
        {
            throw new BadRequestException("Lịch chiếu này đã bị xóa.", "D01");
        }

        var hasSuccessfulBooking = await _cinemaDbContext.Set<DataAccess.Entities.UserInfos.OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleId == itemId &&
                            (od.OrderInfoEntity.OrderStatus == Shared.Enums.OrderStatusEnum.Booked));

        if (hasSuccessfulBooking)
        {
            throw new BadRequestException("Không thể xóa lịch chiếu đã có người đặt vé thành công.", "D03");
        }

        schedule.IsDeleted = true;
        schedule.DeletedByUserId = getCurrentUserId;
        schedule.DeletedAt = DateTime.UtcNow;
        
        _cinemaDbContext.MovieScheduleInfoEntity.Update(schedule);
        await _auditLogService.WriteAsync(
            "Delete",
            "MovieSchedule",
            schedule.MovieScheduleInfoId,
            schedule.MovieInfoEntity.MovieName,
            $"Deleted schedule for movie {schedule.MovieInfoEntity.MovieName}.",
            schedule.AuditoriumInfoEntities.CinemaId);
        await _cinemaDbContext.SaveChangesAsync();

        return new BaseResponse<string>()
        {
            Message = "Xóa lịch chiếu thành công.",
            Data = null,
            IsSuccess = true
        };
    }

    /// <summary>
    /// Called by Hangfire when showtime STARTS - sets IsActive = true
    /// </summary>
    public async Task<bool> SetScheduleActiveStatus(Guid scheduleId)
    {
        var findSchedule = await _cinemaDbContext.MovieScheduleInfoEntity.FindAsync(scheduleId);
        if (findSchedule == null)
        {
            _logger.LogWarning("Schedule {ScheduleId} not found for activation", scheduleId);
            return false;
        }

        try
        {
            findSchedule.IsActive = true;
            _cinemaDbContext.MovieScheduleInfoEntity.Update(findSchedule);
            await _cinemaDbContext.SaveChangesAsync();
            _logger.LogInformation("Schedule {ScheduleId} activated (IsActive=true)", scheduleId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating Movie Schedule {ScheduleId}", scheduleId);
            return false;
        }
    }

    /// <summary>
    /// Called by Hangfire when showtime ENDS - sets IsActive = false
    /// </summary>
    public async Task<bool> SetScheduleInactiveStatus(Guid scheduleId)
    {
        var findSchedule = await _cinemaDbContext.MovieScheduleInfoEntity.FindAsync(scheduleId);
        if (findSchedule == null)
        {
            _logger.LogWarning("Schedule {ScheduleId} not found for deactivation", scheduleId);
            return false;
        }

        try
        {
            findSchedule.IsActive = false;
            _cinemaDbContext.MovieScheduleInfoEntity.Update(findSchedule);
            await _cinemaDbContext.SaveChangesAsync();
            _logger.LogInformation("Schedule {ScheduleId} deactivated (IsActive=false)", scheduleId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating Movie Schedule {ScheduleId}", scheduleId);
            return false;
        }
    }

    private static void NormalizeSlotTimes(IEnumerable<SchedulesInfos>? slots)
    {
        if (slots == null)
        {
            return;
        }

        foreach (var slot in slots)
        {
            slot.StartedDate = NormalizeIncomingVietnamTime(slot.StartedDate);
        }
    }

    private static DateTime NormalizeIncomingVietnamTime(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value.AddHours(-7), DateTimeKind.Utc)
        };
    }

}
