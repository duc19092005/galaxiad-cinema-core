using Cinema.Application.Dtos;
using Cinema.Application.Dtos.TheaterManager.MovieSchedules.Requests;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.Interfaces.TheaterManager;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;
using Cinema.Domain.Utils;
using Microsoft.Extensions.Logging;

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
    private readonly IMovieCacheService _cacheService;

    public UpdateMovieScheduleUseCase(
        IMovieScheduleRepository repository,
        ILogger<UpdateMovieScheduleUseCase> logger,
        IUserContextService userContextService,
        TheaterManagerValidate theaterManagerValidate,
        IAuditLogService auditLogService,
        IBackgroundJobScheduler jobScheduler,
        IUnitOfWork unitOfWork,
        IMovieCacheService cacheService)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _logger = logger;
        _userContextService = userContextService;
        _theaterManagerValidate = theaterManagerValidate;
        _auditLogService = auditLogService;
        _jobScheduler = jobScheduler;
        _cacheService = cacheService;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(Guid auditoriumId, TheaterManagerEditMovieSchedulesRequest request)
    {
        if (request.Slots != null && request.Slots.Any())
        {
            foreach (var slot in request.Slots)
            {
                if (_theaterManagerValidate.ValidateSchedule(slot.ScheduleId))
                {
                    throw new BadRequestException(Messages.Schedule.SchedulesIsNotFoundOrMovieIsInactivated, "E01");
                }
            }
        }

        var currentUserId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");
        var auditoriumExists = await _repository.IsAuditoriumExistForTheaterOrFacilitiesManagerAsync(
            auditoriumId,
            currentUserId,
            isAdmin);

        if (!auditoriumExists)
        {
            throw new NotFoundException(Messages.Schedule.AuditoriumNotFound);
        }

        var cinemaId = await _repository.GetCinemaIdByAuditoriumAsync(auditoriumId);
        if (request.Slots == null || !request.Slots.Any())
        {
            throw new BadRequestException(Messages.Schedule.ScheduleListCannotBeEmpty, "E01");
        }

        await using var transaction = await _unitOfWork.BeginTransactionAsync();

        try
        {
            NormalizeSlotTimes(request.Slots);
            var updatingScheduleIds = request.Slots.Select(slot => slot.ScheduleId).ToList();
            var schedulesToUpdate = await _repository.GetSchedulesForUpdateAsync(auditoriumId, updatingScheduleIds);

            if (schedulesToUpdate.Count != updatingScheduleIds.Count)
            {
                throw new BadRequestException(Messages.Schedule.SchedulesIsNotFoundOrMovieIsInactivated, "E01");
            }

            var hasSuccessfulBooking = await _repository.HasSuccessfulBookingForSchedulesAsync(updatingScheduleIds);
            if (hasSuccessfulBooking)
            {
                throw new BadRequestException(Messages.Schedule.CannotEditBookedShowtimes, "E03");
            }

            var movieIdsToCheck = request.Slots.Select(slot => slot.MovieId).Distinct().ToList();
            var movies = await _repository.GetMoviesByIdsAsync(movieIdsToCheck);
            var supportedFormats = (await _repository.GetMovieFormatRelationsAsync(movieIdsToCheck))
                .GroupBy(relation => relation.MovieId)
                .ToDictionary(group => group.Key, group => group.Select(relation => relation.FormatId).ToList());

            var allFormats = (await _repository.GetAllMovieFormatsAsync())
                .ToDictionary(format => format.MovieFormatId, format => format.MovieFormatName);

            var authorizedMovies = await _repository.GetAuthorizedMovieIdsAsync(movieIdsToCheck, cinemaId);
            var proposedSlots = new List<MovieScheduleInfoEntity>();

            foreach (var slot in request.Slots)
            {
                var existingEntity = schedulesToUpdate.FirstOrDefault(schedule => schedule.MovieScheduleInfoId == slot.ScheduleId);
                var isUnchanged = existingEntity != null &&
                                  existingEntity.MovieId == slot.MovieId &&
                                  existingEntity.MovieFormatId == slot.FormatId &&
                                  existingEntity.StartTime == slot.StartedDate;

                if (!isUnchanged)
                {
                    if (!movies.TryGetValue(slot.MovieId, out var movie))
                    {
                        throw new BadRequestException(Messages.Movie.IdNotExistOrInactive(slot.MovieId), "E01");
                    }

                    if (!authorizedMovies.Contains(slot.MovieId))
                    {
                        throw new BadRequestException(Messages.Schedule.MovieNotAuthorizedForCinema(movie.MovieName), "E01");
                    }

                    if (!supportedFormats.TryGetValue(slot.MovieId, out var movieFormat) || !movieFormat.Contains(slot.FormatId))
                    {
                        var formatName = allFormats.TryGetValue(slot.FormatId, out var name)
                            ? name
                            : slot.FormatId.ToString();
                        throw new BadRequestException(Messages.MovieFormat.InvalidFormatForMovie(movie.MovieName, formatName), "E01");
                    }

                    if (slot.StartedDate < DateTime.UtcNow)
                    {
                        throw new BadRequestException(Messages.Schedule.PastDateNotAllowed, "E01");
                    }

                    if (slot.StartedDate < movie.ActiveAt || slot.StartedDate.Date > movie.EndedDate.Date)
                    {
                        throw new BadRequestException(
                            Messages.Schedule.MovieAvailability(
                                movie.MovieName,
                                movie.ActiveAt.ToString("MM/dd/yyyy"),
                                movie.EndedDate.ToString("MM/dd/yyyy")),
                            "E01");
                    }
                }

                var targetMovie = movies[slot.MovieId];
                var endTime = slot.StartedDate.AddMinutes(targetMovie.MovieDuration);
                proposedSlots.Add(new MovieScheduleInfoEntity
                {
                    MovieScheduleInfoId = slot.ScheduleId,
                    ActiveAt = slot.StartedDate,
                    EndedTime = endTime
                });
            }

            var sortedProposedSlots = proposedSlots.OrderBy(slot => slot.ActiveAt).ToList();
            for (var index = 0; index < sortedProposedSlots.Count - 1; index++)
            {
                if (sortedProposedSlots[index].EndedTime.AddMinutes(15) > sortedProposedSlots[index + 1].ActiveAt)
                {
                    throw new BadRequestException(Messages.Schedule.CleaningGapRequired, "E02");
                }
            }

            var minStartTime = sortedProposedSlots.First().ActiveAt;
            var maxEndTime = sortedProposedSlots.Last().EndedTime.AddMinutes(15);
            var existingSchedules = await _repository.GetExistingSchedulesExcludeIdsAsync(
                auditoriumId,
                minStartTime,
                maxEndTime,
                updatingScheduleIds);

            foreach (var newSlot in proposedSlots)
            {
                var hasConflict = existingSchedules.Any(existing =>
                    newSlot.ActiveAt < existing.EndedTime.AddMinutes(15) &&
                    existing.ActiveAt < newSlot.EndedTime.AddMinutes(15));

                if (hasConflict)
                {
                    throw new BadRequestException(Messages.Schedule.ShowtimeConflictWithCleanup, "E02");
                }
            }

            foreach (var slot in request.Slots)
            {
                var entity = schedulesToUpdate.First(schedule => schedule.MovieScheduleInfoId == slot.ScheduleId);
                var movie = movies[slot.MovieId];

                entity.MovieId = slot.MovieId;
                entity.MovieFormatId = slot.FormatId;
                entity.StartTime = DateTimeHelper.NormalizeIncoming(slot.StartedDate);
                entity.ActiveAt = DateTimeHelper.NormalizeIncoming(slot.StartedDate);
                entity.EndedTime = DateTimeHelper.NormalizeIncoming(slot.StartedDate.AddMinutes(movie.MovieDuration));
                entity.UpdatedByUserId = currentUserId;
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
            await transaction.CommitAsync();

            try
            {
                await _cacheService.ClearMovieCatalogCacheAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to clear movie catalog cache on Redis");
            }

            foreach (var slot in request.Slots)
            {
                var movie = movies[slot.MovieId];
                _jobScheduler.Enqueue<IScheduleJobsService>(
                    service => service.UpdatedJobIntoBackground(
                        SchedulesJobCategoryEnums.Schedules,
                        slot.ScheduleId,
                        slot.StartedDate,
                        slot.StartedDate.AddMinutes(movie.MovieDuration)));
            }

            return new BaseResponse<string>
            {
                Message = Messages.Schedule.MovieScheduleUpdated,
                Data = null,
                IsSuccess = true
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();

            if (ex is AppException)
            {
                throw;
            }

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
