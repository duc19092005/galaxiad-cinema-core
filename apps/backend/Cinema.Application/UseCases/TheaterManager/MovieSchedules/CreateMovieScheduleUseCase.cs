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

public class CreateMovieScheduleUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMovieScheduleRepository _repository;
    private readonly ILogger<CreateMovieScheduleUseCase> _logger;
    private readonly IUserContextService _userContextService;
    private readonly IAuditLogService _auditLogService;
    private readonly IBackgroundJobScheduler _jobScheduler;
    private readonly IMovieCacheService _cacheService;

    public CreateMovieScheduleUseCase(
        IMovieScheduleRepository repository,
        ILogger<CreateMovieScheduleUseCase> logger,
        IUserContextService userContextService,
        IAuditLogService auditLogService,
        IBackgroundJobScheduler jobScheduler,
        IUnitOfWork unitOfWork,
        IMovieCacheService cacheService)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _logger = logger;
        _userContextService = userContextService;
        _auditLogService = auditLogService;
        _jobScheduler = jobScheduler;
        _cacheService = cacheService;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(TheaterManagerAddMovieSchedulesRequest request)
    {
        var currentUserId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var auditoriumExists = await _repository.IsAuditoriumExistForManagerAsync(
            request.AuditoriumId,
            currentUserId,
            isAdmin);

        if (!auditoriumExists)
        {
            throw new NotFoundException(Messages.Schedule.AuditoriumNotFound);
        }

        var cinemaId = await _repository.GetCinemaIdByAuditoriumAsync(request.AuditoriumId);
        await using var transaction = await _unitOfWork.BeginTransactionAsync();

        try
        {
            NormalizeSlotTimes(request.Slots);
            var requestedMovieIds = request.Slots.Select(slot => slot.MovieId).Distinct().ToList();
            var validMovieDictionary = await _repository.GetMoviesByIdsAsync(requestedMovieIds);

            var validMovieFormats = (await _repository.GetMovieFormatRelationsAsync(requestedMovieIds))
                .GroupBy(relation => relation.MovieId)
                .ToDictionary(group => group.Key, group => group.Select(format => format.FormatId).ToList());

            var allFormats = (await _repository.GetAllMovieFormatsAsync())
                .ToDictionary(format => format.MovieFormatId, format => format.MovieFormatName);

            var authorizedMovies = await _repository.GetAuthorizedMovieIdsAsync(requestedMovieIds, cinemaId);
            var proposedSlots = new List<MovieScheduleInfoEntity>();
            var existingMatchSchedules = await _repository.GetExistingSchedulesForAuditoriumAsync(
                request.AuditoriumId,
                DateTime.MinValue,
                DateTime.MaxValue);

            foreach (var slot in request.Slots)
            {
                var alreadyExists = existingMatchSchedules.Any(existing =>
                    existing.MovieId == slot.MovieId &&
                    existing.MovieFormatId == slot.FormatId &&
                    existing.StartTime == slot.StartedDate);

                if (alreadyExists)
                {
                    continue;
                }

                if (!validMovieDictionary.TryGetValue(slot.MovieId, out var movie))
                {
                    throw new BadRequestException(Messages.Movie.IdNotExistOrInactive(slot.MovieId), "E01");
                }

                if (!authorizedMovies.Contains(slot.MovieId))
                {
                    throw new BadRequestException(Messages.Schedule.MovieNotAuthorizedForCinema(movie.MovieName), "E01");
                }

                if (!validMovieFormats.TryGetValue(slot.MovieId, out var movieFormat) || !movieFormat.Contains(slot.FormatId))
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

                var endTime = slot.StartedDate.AddMinutes(movie.MovieDuration);
                var normalizedStart = DateTimeHelper.NormalizeIncoming(slot.StartedDate);
                var normalizedEnd = DateTimeHelper.NormalizeIncoming(endTime);

                proposedSlots.Add(new MovieScheduleInfoEntity
                {
                    MovieScheduleInfoId = Guid.NewGuid(),
                    MovieId = slot.MovieId,
                    AuditoriumId = request.AuditoriumId,
                    MovieFormatId = slot.FormatId,
                    StartTime = normalizedStart,
                    EndedTime = normalizedEnd,
                    ActiveAt = normalizedStart,
                    CreatedByUserId = currentUserId,
                    IsActive = DateTime.UtcNow >= normalizedStart && DateTime.UtcNow < normalizedEnd
                });
            }

            if (!proposedSlots.Any())
            {
                return new BaseResponse<string>
                {
                    Message = Messages.Schedule.NoNewSchedulesToAdd,
                    Data = null,
                    IsSuccess = true
                };
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
            var existingSchedules = await _repository.GetExistingSchedulesForAuditoriumAsync(
                request.AuditoriumId,
                minStartTime,
                maxEndTime);

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

            await _repository.AddSchedulesAsync(proposedSlots);
            await _auditLogService.WriteAsync(
                "Create",
                "MovieSchedule",
                request.AuditoriumId,
                $"Auditorium {request.AuditoriumId}",
                $"Created {proposedSlots.Count} movie schedule(s).",
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

            foreach (var slot in proposedSlots)
            {
                _jobScheduler.Enqueue<IScheduleJobsService>(
                    service => service.AddJobIntoBackground(
                        SchedulesJobCategoryEnums.Schedules,
                        slot.MovieScheduleInfoId,
                        slot.ActiveAt,
                        slot.EndedTime));
            }

            return new BaseResponse<string>
            {
                Message = Messages.Schedule.CreateCompleted,
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

            _logger.LogError(ex, "Error creating movie schedule");
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
