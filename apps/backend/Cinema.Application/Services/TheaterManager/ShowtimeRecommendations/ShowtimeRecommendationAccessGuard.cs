using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.TheaterManager;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Localization;

namespace Cinema.Application.Services.TheaterManager.ShowtimeRecommendations;

public class ShowtimeRecommendationAccessGuard
{
    private readonly IShowtimeRecommendationRepository _repository;

    public ShowtimeRecommendationAccessGuard(IShowtimeRecommendationRepository repository)
    {
        _repository = repository;
    }

    public async Task EnsureCinemaAccessAsync(Guid cinemaId, Guid userId, bool isAdmin)
    {
        if (!await _repository.CanManageCinemaAsync(cinemaId, userId, isAdmin))
        {
            throw new BadRequestException(Messages.ShowtimeRecommendation.NoCinemaPermission, "REC_FORBIDDEN");
        }
    }

    public async Task<ShowtimeRecommendationBatchEntity> GetAuthorizedBatchAsync(Guid batchId, Guid userId, bool isAdmin)
    {
        var batch = await _repository.GetBatchWithItemsAsync(batchId);
        if (batch == null)
        {
            throw new BadRequestException(Messages.ShowtimeRecommendation.BatchNotFound, "REC04");
        }

        await EnsureCinemaAccessAsync(batch.CinemaId, userId, isAdmin);
        return batch;
    }
}
