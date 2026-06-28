using Cinema.Application.Dtos.TheaterManager.ShowtimeRecommendations;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.Interfaces.TheaterManager;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Enums;
using Cinema.Domain.Localization;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.Services.TheaterManager.ShowtimeRecommendations;

public class ShowtimeRecommendationApplyService
{
    private readonly IShowtimeRecommendationRepository _repository;
    private readonly IBackgroundJobScheduler _jobScheduler;
    private readonly IMovieCacheService _cacheService;
    private readonly ILogger<ShowtimeRecommendationApplyService> _logger;

    public ShowtimeRecommendationApplyService(
        IShowtimeRecommendationRepository repository,
        IBackgroundJobScheduler jobScheduler,
        IMovieCacheService cacheService,
        ILogger<ShowtimeRecommendationApplyService> logger)
    {
        _repository = repository;
        _jobScheduler = jobScheduler;
        _cacheService = cacheService;
        _logger = logger;
    }

    public List<MovieScheduleInfoEntity> BuildSchedules(List<ShowtimeRecommendationItemEntity> validItems, Guid userId)
    {
        return validItems.Select(item => new MovieScheduleInfoEntity
        {
            MovieScheduleInfoId = Guid.NewGuid(),
            MovieId = item.MovieId,
            AuditoriumId = item.AuditoriumId,
            MovieFormatId = item.FormatId,
            StartTime = item.StartTime,
            EndedTime = item.EndTime,
            ActiveAt = item.StartTime,
            CreatedByUserId = userId,
            IsActive = DateTime.UtcNow >= item.StartTime && DateTime.UtcNow < item.EndTime
        }).ToList();
    }

    public async Task<List<AppliedShowtimeRecommendationDto>> MarkAppliedAsync(
        List<ShowtimeRecommendationItemEntity> validItems,
        List<MovieScheduleInfoEntity> schedules,
        Guid userId)
    {
        var applied = new List<AppliedShowtimeRecommendationDto>();
        for (var index = 0; index < validItems.Count; index++)
        {
            var item = validItems[index];
            var schedule = schedules[index];
            item.Status = ShowtimeRecommendationStatusEnum.Applied;
            item.AppliedAt = DateTime.UtcNow;
            item.AppliedByUserId = userId;
            item.AppliedScheduleId = schedule.MovieScheduleInfoId;
            item.LastValidationMessage = null;

            await _repository.AddActionAsync(new ShowtimeRecommendationActionEntity
            {
                ActionId = Guid.NewGuid(),
                RecommendationId = item.RecommendationId,
                ActorUserId = userId,
                ActionType = "Applied",
                Notes = Messages.ShowtimeRecommendation.ApplySuccess,
                CreatedAt = DateTime.UtcNow
            });

            applied.Add(new AppliedShowtimeRecommendationDto
            {
                RecommendationId = item.RecommendationId,
                ScheduleId = schedule.MovieScheduleInfoId,
                MovieName = item.MovieInfoEntity?.MovieName ?? string.Empty,
                AuditoriumNumber = item.AuditoriumInfoEntity?.AuditoriumNumber ?? string.Empty,
                StartTime = item.StartTime,
                EndTime = item.EndTime
            });
        }

        return applied;
    }

    public async Task MarkInvalidAsync(
        List<ShowtimeRecommendationItemEntity> selected,
        List<ShowtimeRecommendationValidationDto> invalidSuggestions,
        Guid userId)
    {
        foreach (var failed in invalidSuggestions)
        {
            var item = selected.FirstOrDefault(x => x.RecommendationId == failed.RecommendationId);
            if (item == null) continue;

            item.Status = ShowtimeRecommendationStatusEnum.FailedValidation;
            item.LastValidationMessage = string.Join(" ", failed.Reasons);
            await _repository.AddActionAsync(new ShowtimeRecommendationActionEntity
            {
                ActionId = Guid.NewGuid(),
                RecommendationId = item.RecommendationId,
                ActorUserId = userId,
                ActionType = "FailedValidation",
                Notes = item.LastValidationMessage,
                CreatedAt = DateTime.UtcNow
            });
        }
    }

    public async Task ClearCatalogCacheSafeAsync()
    {
        try
        {
            await _cacheService.ClearMovieCatalogCacheAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to clear movie catalog cache on Redis");
        }
    }

    public void EnqueueScheduleJobs(IEnumerable<MovieScheduleInfoEntity> schedules)
    {
        foreach (var schedule in schedules)
        {
            _jobScheduler.Enqueue<IScheduleJobsService>(
                service => service.AddJobIntoBackground(
                    SchedulesJobCategoryEnums.Schedules,
                    schedule.MovieScheduleInfoId,
                    schedule.ActiveAt,
                    schedule.EndedTime));
        }
    }
}
