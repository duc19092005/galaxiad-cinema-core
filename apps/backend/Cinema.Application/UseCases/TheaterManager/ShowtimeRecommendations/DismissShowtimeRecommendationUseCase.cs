using Cinema.Application.Dtos;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.TheaterManager;
using Cinema.Application.Services.TheaterManager.ShowtimeRecommendations;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager.ShowtimeRecommendations;

public class DismissShowtimeRecommendationUseCase
{
    private readonly IShowtimeRecommendationRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ShowtimeRecommendationAccessGuard _accessGuard;

    public DismissShowtimeRecommendationUseCase(
        IShowtimeRecommendationRepository repository,
        IUserContextService userContextService,
        IUnitOfWork unitOfWork,
        ShowtimeRecommendationAccessGuard accessGuard)
    {
        _repository = repository;
        _userContextService = userContextService;
        _unitOfWork = unitOfWork;
        _accessGuard = accessGuard;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid recommendationId)
    {
        var userId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");
        var item = (await _repository.GetItemsAsync(Guid.Empty, [recommendationId])).FirstOrDefault();
        if (item == null)
        {
            throw new BadRequestException(Messages.ShowtimeRecommendation.RecommendationNotFound, "REC04");
        }

        await _accessGuard.EnsureCinemaAccessAsync(item.CinemaId, userId, isAdmin);
        item.Status = ShowtimeRecommendationStatusEnum.Dismissed;
        item.DismissedAt = DateTime.UtcNow;
        item.DismissedByUserId = userId;
        await _repository.AddActionAsync(new ShowtimeRecommendationActionEntity
        {
            ActionId = Guid.NewGuid(),
            RecommendationId = item.RecommendationId,
            ActorUserId = userId,
            ActionType = "Dismissed",
            Notes = Messages.ShowtimeRecommendation.DismissSuccess,
            CreatedAt = DateTime.UtcNow
        });

        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = Messages.ShowtimeRecommendation.DismissSuccess
        };
    }
}
