using Cinema.Application.Dtos;
using Cinema.Application.Dtos.TheaterManager.ShowtimeRecommendations;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.TheaterManager;
using Cinema.Application.Policies.TheaterManager.ShowtimeRecommendations;
using Cinema.Application.Services.TheaterManager.ShowtimeRecommendations;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager.ShowtimeRecommendations;

public class PreviewShowtimeRecommendationsUseCase
{
    private readonly IShowtimeRecommendationRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ShowtimeRecommendationAccessGuard _accessGuard;
    private readonly ShowtimeRecommendationPreviewService _previewService;

    public PreviewShowtimeRecommendationsUseCase(
        IShowtimeRecommendationRepository repository,
        IUserContextService userContextService,
        IUnitOfWork unitOfWork,
        ShowtimeRecommendationAccessGuard accessGuard,
        ShowtimeRecommendationPreviewService previewService)
    {
        _repository = repository;
        _userContextService = userContextService;
        _unitOfWork = unitOfWork;
        _accessGuard = accessGuard;
        _previewService = previewService;
    }

    public async Task<BaseResponse<ShowtimeRecommendationPreviewDto>> ExecuteAsync(RecommendationSelectionRequest request)
    {
        var userId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");
        var batch = await _accessGuard.GetAuthorizedBatchAsync(request.BatchId, userId, isAdmin);
        var selected = ShowtimeRecommendationSelectionPolicy.Select(batch, request.RecommendationIds);
        var preview = await _previewService.BuildAsync(batch, selected);

        foreach (var item in selected)
        {
            await _repository.AddActionAsync(new ShowtimeRecommendationActionEntity
            {
                ActionId = Guid.NewGuid(),
                RecommendationId = item.RecommendationId,
                ActorUserId = userId,
                ActionType = "Viewed",
                Notes = Messages.ShowtimeRecommendation.PreviewSuccess,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<ShowtimeRecommendationPreviewDto>
        {
            IsSuccess = true,
            Data = preview,
            Message = Messages.ShowtimeRecommendation.PreviewSuccess
        };
    }
}
