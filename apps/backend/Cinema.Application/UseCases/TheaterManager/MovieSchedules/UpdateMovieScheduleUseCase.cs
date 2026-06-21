using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.TheaterManager.MovieSchedules.Requests;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.Interfaces.TheaterManager;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Enums;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;
using Cinema.Domain.Utils;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.TheaterManager.MovieSchedules;

public class UpdateMovieScheduleUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMovieScheduleRepository _repository;
    private readonly ILogger<UpdateMovieScheduleUseCase> _logger;
    private readonly IUserContextService _userContextService;
    private readonly TheaterManagerValidate _theaterManagerValidate;
    private readonly IAuditLogService _auditLogService;
    private readonly IBackgroundJobScheduler _jobScheduler;

    public UpdateMovieScheduleUseCase(
        IMovieScheduleRepository repository,
        ILogger<UpdateMovieScheduleUseCase> logger,
        IUserContextService userContextService,
        TheaterManagerValidate theaterManagerValidate,
        IAuditLogService auditLogService,
        IBackgroundJobScheduler jobScheduler,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _logger = logger;
        _userContextService = userContextService;
        _theaterManagerValidate = theaterManagerValidate;
        _auditLogService = auditLogService;
        _jobScheduler = jobScheduler;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(Guid auditoriumId, TheaterManagerEditMovieSchedulesRequest request)
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

        var isAuditoriumExist = await _repository.IsAuditoriumExistForTheaterOrFacilitiesManagerAsync(auditoriumId, getCurrentUserId, isAdmin);

        if (!isAuditoriumExist)
        {
            throw new NotFoundException(Messages.Schedule.AuditoriumNotFound);
        }

        var cinemaId = await _repository.GetCinemaIdByAuditoriumAsync(auditoriumId);

        if (request.Slots == null || !request.Slots.Any())
        {
            throw new BadRequestException(Messages.Schedule.ScheduleListCannotBeEmpty, "E01");
        }

        await using var transactions = await _unitOfWork.BeginTransactionAsync();

        try
        {
            NormalizeSlotTimes(request.Slots);
            var updatingScheduleIds = request.Slots.Select(s => s.ScheduleId).ToList();
            var movieNames = await _repository.GetMovieNamesForSchedulesAsync(updatingScheduleIds);
            var schedulesToUpdate = await _repository.GetSchedulesForUpdateAsync(auditoriumId, updatingScheduleIds);

            if (schedulesToUpdate.Count != updatingScheduleIds.Count)
            {
                throw new BadRequestException(Messages.Schedule.SchedulesIsNotFoundOrMovieIsInactivated, "E01");
            }

            var hasSuccessfulBookingOnUpdatingSchedules = await _repository.HasSuccessfulBookingForSchedulesAsync(updatingScheduleIds);

            if (hasSuccessfulBookingOnUpdatingSchedules)
            {
                throw new BadRequestException("Không thể sửa các suất chiếu đã có người đặt vé thành công.", "E03");
            }

            var movieIdsToCheck = request.Slots.Select(s => s.MovieId).Distinct().ToList();

            var moviesInfos = await _repository.GetMoviesByIdsAsync(movieIdsToCheck);

            var findMoviesSupportedFormat = (await _repository.GetMovieFormatRelationsAsync(movieIdsToCheck))
                .GroupBy(x => x.MovieId)
                .ToDictionary(m => m.Key, f => f.Select(x => x.FormatId).ToList());

            var allFormats = (await _repository.GetAllMovieFormatsAsync())
                .ToDictionary(x => x.MovieFormatId, x => x.MovieFormatName);

            // Kiểm tra phim đã được ủy quyền tại rạp chưa
            var authorizedMovies = await _repository.GetAuthorizedMovieIdsAsync(movieIdsToCheck, cinemaId);

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

            var existingDbSchedules = await _repository.GetExistingSchedulesExcludeIdsAsync(auditoriumId, minStartTime, maxEndTime, updatingScheduleIds);

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
                entity.StartTime = DateTimeHelper.NormalizeIncoming(slot.StartedDate);
                entity.ActiveAt = DateTimeHelper.NormalizeIncoming(slot.StartedDate);
                entity.EndedTime = DateTimeHelper.NormalizeIncoming(slot.StartedDate.AddMinutes(movie.MovieDuration));
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

            await _unitOfWork.SaveChangesAsync();
            await transactions.CommitAsync();

            foreach (var slot in request.Slots)
            {
                var movie = moviesInfos[slot.MovieId];
                _jobScheduler.Enqueue<IScheduleJobsService>(s => s.UpdatedJobIntoBackground(SchedulesJobCategoryEnums.Schedules, slot.ScheduleId, slot.StartedDate, slot.StartedDate.AddMinutes(movie.MovieDuration)));
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

    private static void NormalizeSlotTimes(IEnumerable<SchedulesInfos>? slots)
    {
        if (slots == null)
        {
            return;
        }

        foreach (var slot in slots)
        {
            slot.StartedDate = DateTimeHelper.NormalizeIncoming(slot.StartedDate);
        }
    }
}
