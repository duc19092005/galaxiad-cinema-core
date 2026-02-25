using BusinessLayer.Dtos;
using BusinessLayer.Dtos.TheaterManager.MovieSchedules;
using BusinessLayer.Interfaces.IBehaviors;
using BusinessLayer.Services.IdentityAccess;
using DataAccess;
using DataAccess.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Shared.Exceptions;
using Shared.Localization;

namespace BusinessLayer.UseCases.TheaterManager.MovieSchedules;

public class WriteMovieSchedulesUseCase : IWriteBehavior<TheaterManagerAddMovieSchedulesRequest,
    TheaterManagerEditMovieSchedulesRequest, string>
{
    private readonly CinemaDbContext _cinemaDbContext;
    
    private readonly ILogger<WriteMovieSchedulesUseCase> _logger;
    
    private readonly IUserContextService _userContextService;

    public WriteMovieSchedulesUseCase(CinemaDbContext cinemaDbContext , ILogger<WriteMovieSchedulesUseCase> logger ,
        IUserContextService userContextService)
    {
        _cinemaDbContext = cinemaDbContext;
        _logger = logger;
        _userContextService = userContextService;
    }
    public async Task<BaseResponse<string>> AddItem(TheaterManagerAddMovieSchedulesRequest request)
    {
        var getCurrentUserId = _userContextService.GetUserId();

        var isAuditoriumExist = await _cinemaDbContext.AuditoriumInfoEntities
            .AsNoTracking()
            .AnyAsync(x => x.AuditoriumId == request.AuditoriumId);
            
        if (!isAuditoriumExist)
        {
            throw new NotFoundException(Messages.Schedule.AuditoriumNotFound);
        }

        var transactions = await _cinemaDbContext.Database.BeginTransactionAsync();

        try
        {
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

            var proposedSlots = new List<MovieScheduleInfoEntity>();

            foreach (var slot in request.Slots)
            {
                if (!validMovieDictionary.TryGetValue(slot.MovieId, out var movie))
                {
                    throw new BadRequestException(Messages.Movie.IdNotExistOrInactive(slot.MovieId), "E01");
                }

                if (!validMovieFormats.TryGetValue(slot.MovieId, out var movieFormat) || !movieFormat.Contains(slot.FormatId))
                {
                    throw new BadRequestException(Messages.MovieFormat.InvalidFormatForMovie(movie.MovieName), "E01");
                }

                if (slot.StartedDate < DateTime.Now)
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
                    EndedTime = endTime,
                    CreatedByUserId = getCurrentUserId,
                    IsActive = DateTime.Now >= slot.StartedDate && DateTime.Now < endTime,
                });
            }

            var sortedProposedSlots = proposedSlots.OrderBy(x => x.ActiveAt).ToList();
            
            for (int i = 0; i < sortedProposedSlots.Count - 1; i++)
            {
                if (sortedProposedSlots[i].EndedTime > sortedProposedSlots[i + 1].ActiveAt)
                {
                    throw new BadRequestException(Messages.Schedule.OverlappingSchedules, "E02");
                }
            }

            var minStartTime = sortedProposedSlots.First().ActiveAt;
            var maxEndTime = sortedProposedSlots.Last().EndedTime;

            var existingSchedules = await _cinemaDbContext.MovieScheduleInfoEntity
                .AsNoTracking()
                .Where(x => x.AuditoriumId == request.AuditoriumId 
                         && x.EndedTime > minStartTime 
                         && x.ActiveAt < maxEndTime)
                .ToListAsync();

            foreach (var newSlot in proposedSlots)
            {
                var hasConflict = existingSchedules.Any(existing => 
                    newSlot.ActiveAt < existing.EndedTime && existing.ActiveAt < newSlot.EndedTime);

                if (hasConflict)
                {
                    throw new BadRequestException(Messages.Schedule.TimeSlotConflict(newSlot.ActiveAt.ToString("HH:mm"), newSlot.EndedTime.ToString("HH:mm")), "E02");
                }
            }

            await _cinemaDbContext.MovieScheduleInfoEntity.AddRangeAsync(proposedSlots);
            await _cinemaDbContext.SaveChangesAsync();
            await transactions.CommitAsync();

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
        var getCurrentUserId = _userContextService.GetUserId();

        var isAuditoriumExist = await _cinemaDbContext.AuditoriumInfoEntities
            .AsNoTracking()
            .AnyAsync(x => x.AuditoriumId == auditoriumId);

        if (!isAuditoriumExist)
        {
            throw new NotFoundException(Messages.Schedule.AuditoriumNotFound);
        }

        if (request.Slots == null || !request.Slots.Any())
        {
            throw new BadRequestException(Messages.Schedule.ScheduleListCannotBeEmpty, "E01");
        }

        var transactions = await _cinemaDbContext.Database.BeginTransactionAsync();

        try
        {
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

            var proposedSlots = new List<MovieScheduleInfoEntity>();

            foreach (var slot in request.Slots)
            {
                if (!moviesInfos.TryGetValue(slot.MovieId, out var movie))
                {
                    throw new BadRequestException(Messages.Movie.IdNotExistOrInactive(slot.MovieId), "E01");
                }

                if (!findMoviesSupportedFormat.TryGetValue(slot.MovieId, out var movieFormat) || !movieFormat.Contains(slot.FormatId))
                {
                    throw new BadRequestException(Messages.MovieFormat.InvalidFormatForMovie(movie.MovieName), "E01");
                }

                if (slot.StartedDate < DateTime.Now)
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
                    MovieScheduleInfoId = slot.ScheduleId, 
                    ActiveAt = slot.StartedDate,
                    EndedTime = endTime
                });
            }

            var sortedProposedSlots = proposedSlots.OrderBy(x => x.ActiveAt).ToList();
            
            for (int i = 0; i < sortedProposedSlots.Count - 1; i++)
            {
                if (sortedProposedSlots[i].EndedTime > sortedProposedSlots[i + 1].ActiveAt)
                {
                    throw new BadRequestException(Messages.Schedule.OverlappingSchedules, "E02");
                }
            }

            var minStartTime = sortedProposedSlots.First().ActiveAt;
            var maxEndTime = sortedProposedSlots.Last().EndedTime;

            var existingDbSchedules = await _cinemaDbContext.MovieScheduleInfoEntity
                .AsNoTracking()
                .Where(x => x.AuditoriumId == auditoriumId 
                         && x.EndedTime > minStartTime 
                         && x.ActiveAt < maxEndTime
                         && !x.IsDeleted
                         && !updatingScheduleIds.Contains(x.MovieScheduleInfoId)) 
                .ToListAsync();

            foreach (var newSlot in proposedSlots)
            {
                var hasConflict = existingDbSchedules.Any(existing => 
                    newSlot.ActiveAt < existing.EndedTime && existing.ActiveAt < newSlot.EndedTime);

                if (hasConflict)
                {
                    throw new BadRequestException(Messages.Schedule.TimeSlotConflict(newSlot.ActiveAt.ToString("HH:mm"), newSlot.EndedTime.ToString("HH:mm")), "E02");
                }
            }

            foreach (var slot in request.Slots)
            {
                var entity = schedulesToUpdate.First(x => x.MovieScheduleInfoId == slot.ScheduleId);
                var movie = moviesInfos[slot.MovieId];

                entity.MovieId = slot.MovieId;
                entity.MovieFormatId = slot.FormatId;
                entity.ActiveAt = slot.StartedDate;
                entity.EndedTime = slot.StartedDate.AddMinutes(movie.MovieDuration);
                entity.UpdatedByUserId = getCurrentUserId;
                entity.UpdatedAt = DateTime.Now;
            }

            await _cinemaDbContext.SaveChangesAsync();
            await transactions.CommitAsync();

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
        return new BaseResponse<string>()
        {
            Message = "Create Movie Schedule Completed",
            Data = null,
            IsSuccess = true
        };
    }

}