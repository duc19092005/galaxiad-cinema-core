using Cinema.Application.Dtos.TheaterManager;

namespace Cinema.Application.Interfaces.Facilities;

public interface ITheaterManagerDataRepository
{
    Task<bool> IsManagerOfCinemaAsync(Guid cinemaId, Guid userId);
    Task<List<TheaterManagerMovieOptionDto>> GetMoviesWithFormatsAsync(Guid cinemaId);
    Task<TheaterManagerAuditoriumSelectionDto?> GetMyAuditoriumsAsync(Guid? cinemaId, Guid userId, bool isAdmin);
}
