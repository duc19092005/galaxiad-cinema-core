using Cinema.Application.Dtos;
using Cinema.Application.Dtos.TheaterManager.ShowtimeRecommendations;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.TheaterManager;
using Cinema.Application.Services.TheaterManager.ShowtimeRecommendations;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager.ShowtimeRecommendations;

public class GetShowtimeRecommendationHistoryUseCase
{
    private readonly IShowtimeRecommendationRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly ShowtimeRecommendationAccessGuard _accessGuard;

    public GetShowtimeRecommendationHistoryUseCase(
        IShowtimeRecommendationRepository repository,
        IUserContextService userContextService,
        ShowtimeRecommendationAccessGuard accessGuard)
    {
        _repository = repository;
        _userContextService = userContextService;
        _accessGuard = accessGuard;
    }

    public async Task<BaseResponse<List<ShowtimeRecommendationHistoryDto>>> ExecuteAsync(Guid cinemaId, int take)
    {
        var userId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");
        await _accessGuard.EnsureCinemaAccessAsync(cinemaId, userId, isAdmin);

        var history = await _repository.GetHistoryAsync(cinemaId, userId, isAdmin, Math.Clamp(take, 1, 50));
        return new BaseResponse<List<ShowtimeRecommendationHistoryDto>>
        {
            IsSuccess = true,
            Data = history,
            Message = Messages.ShowtimeRecommendation.HistorySuccess
        };
    }
}
