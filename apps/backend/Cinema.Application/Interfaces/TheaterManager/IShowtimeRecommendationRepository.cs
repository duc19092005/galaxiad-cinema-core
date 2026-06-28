using Cinema.Application.Dtos.TheaterManager.ShowtimeRecommendations;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Application.Interfaces.TheaterManager;

public interface IShowtimeRecommendationRepository
{
    Task<bool> CanManageCinemaAsync(Guid cinemaId, Guid userId, bool isAdmin);
    Task<List<AuditoriumInfoEntities>> GetAuditoriumsAsync(Guid cinemaId, Guid? auditoriumId);
    Task<List<MovieInfoEntity>> GetActiveMoviesForCinemaAsync(Guid cinemaId, DateTime fromUtc, DateTime toUtc);
    Task<List<MovieFormatInfoEntity>> GetMovieFormatsAsync();
    Task<List<movieFormatMovieInfoEntity>> GetMovieFormatRelationsAsync(IEnumerable<Guid> movieIds);
    Task<List<MovieScheduleInfoEntity>> GetSchedulesForCinemaAsync(Guid cinemaId, DateTime fromUtc, DateTime toUtc);
    Task<List<OrderDetailsInfo>> GetPaidOrderDetailsForCinemaAsync(Guid cinemaId, DateTime fromUtc, DateTime toUtc);
    Task<Dictionary<Guid, int>> GetMovieViewCountsAsync(IEnumerable<Guid> movieIds, DateTime fromUtc, DateTime toUtc);
    Task<Dictionary<Guid, (decimal Average, int Count)>> GetMovieRatingsAsync(IEnumerable<Guid> movieIds);
    Task<ShowtimeRecommendationBatchEntity?> GetBatchWithItemsAsync(Guid batchId);
    Task<List<ShowtimeRecommendationItemEntity>> GetItemsAsync(Guid batchId, IEnumerable<Guid> recommendationIds);
    Task AddBatchAsync(ShowtimeRecommendationBatchEntity batch);
    Task AddSchedulesAsync(IEnumerable<MovieScheduleInfoEntity> schedules);
    Task AddActionAsync(ShowtimeRecommendationActionEntity action);
    Task<List<ShowtimeRecommendationHistoryDto>> GetHistoryAsync(Guid cinemaId, Guid userId, bool isAdmin, int take);
}

