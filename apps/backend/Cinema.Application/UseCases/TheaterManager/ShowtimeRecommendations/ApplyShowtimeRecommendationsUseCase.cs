using Cinema.Application.Dtos;
using Cinema.Application.Dtos.TheaterManager.ShowtimeRecommendations;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.TheaterManager;
using Cinema.Application.Policies.TheaterManager.ShowtimeRecommendations;
using Cinema.Application.Services.TheaterManager.ShowtimeRecommendations;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.TheaterManager.ShowtimeRecommendations;

public class ApplyShowtimeRecommendationsUseCase
{
    private readonly IShowtimeRecommendationRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogService _auditLogService;
    private readonly ShowtimeRecommendationAccessGuard _accessGuard;
    private readonly ShowtimeRecommendationPreviewService _previewService;
    private readonly ShowtimeRecommendationApplyService _applyService;
    private readonly ILogger<ApplyShowtimeRecommendationsUseCase> _logger;

    public ApplyShowtimeRecommendationsUseCase(
        IShowtimeRecommendationRepository repository,
        IUserContextService userContextService,
        IUnitOfWork unitOfWork,
        IAuditLogService auditLogService,
        ShowtimeRecommendationAccessGuard accessGuard,
        ShowtimeRecommendationPreviewService previewService,
        ShowtimeRecommendationApplyService applyService,
        ILogger<ApplyShowtimeRecommendationsUseCase> logger)
    {
        _repository = repository;
        _userContextService = userContextService;
        _unitOfWork = unitOfWork;
        _auditLogService = auditLogService;
        _accessGuard = accessGuard;
        _previewService = previewService;
        _applyService = applyService;
        _logger = logger;
    }

    public async Task<BaseResponse<ApplyShowtimeRecommendationsResponse>> ExecuteAsync(ApplyShowtimeRecommendationsRequest request)
    {
        var userId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");
        var batch = await _accessGuard.GetAuthorizedBatchAsync(request.BatchId, userId, isAdmin);
        var selected = ShowtimeRecommendationSelectionPolicy.Select(batch, request.RecommendationIds)
            .Where(x => x.Status == ShowtimeRecommendationStatusEnum.Suggested)
            .ToList();
        var preview = await _previewService.BuildAsync(batch, selected);

        if (preview.InvalidSuggestions.Count > 0 && !request.ApplyValidOnly)
        {
            return new BaseResponse<ApplyShowtimeRecommendationsResponse>
            {
                IsSuccess = false,
                Data = new ApplyShowtimeRecommendationsResponse
                {
                    BatchId = batch.BatchId,
                    Failed = preview.InvalidSuggestions
                },
                Message = Messages.ShowtimeRecommendation.ApplyValidationFailed
            };
        }

        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var validIds = preview.ValidSuggestions.Select(x => x.RecommendationId).ToHashSet();
            var validItems = selected.Where(x => validIds.Contains(x.RecommendationId)).ToList();
            var schedules = _applyService.BuildSchedules(validItems, userId);
            var applied = await _applyService.MarkAppliedAsync(validItems, schedules, userId);
            await _applyService.MarkInvalidAsync(selected, preview.InvalidSuggestions, userId);

            await _repository.AddSchedulesAsync(schedules);
            await _auditLogService.WriteAsync(
                "Apply",
                "ShowtimeRecommendation",
                batch.BatchId,
                $"Recommendation batch {batch.BatchId}",
                Messages.ShowtimeRecommendation.AppliedAuditDescription(applied.Count),
                batch.CinemaId);

            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();
            await _applyService.ClearCatalogCacheSafeAsync();
            _applyService.EnqueueScheduleJobs(schedules);

            return new BaseResponse<ApplyShowtimeRecommendationsResponse>
            {
                IsSuccess = true,
                Data = new ApplyShowtimeRecommendationsResponse
                {
                    BatchId = batch.BatchId,
                    Applied = applied,
                    Failed = preview.InvalidSuggestions
                },
                Message = Messages.ShowtimeRecommendation.ApplySuccess
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            if (ex is AppException)
            {
                throw;
            }

            _logger.LogError(ex, "Error applying showtime recommendations");
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
}
