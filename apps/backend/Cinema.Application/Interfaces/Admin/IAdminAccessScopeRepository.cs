using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;

namespace Cinema.Application.Interfaces.Admin;

public interface IAdminAccessScopeRepository
{
    Task<List<Guid>> GetManagerCinemaIdsAsync(Guid userId, bool isFacilitiesManager, bool isTheaterManager);
    Task<List<CinemaInfoEntity>> GetCinemasByManagerOrIdAsync(Guid? managerUserId, Guid? cinemaId, bool isFacilities);
    Task<List<MovieInfoEntity>> GetMoviesByManagerOrIdAsync(Guid? managerUserId, Guid? movieId);
}
