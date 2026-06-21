using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;

namespace Cinema.Application.Interfaces.Booking;

public interface IBookingCatalogRepository
{
    Task<List<CinemaInfoEntity>> GetActiveCinemasAsync();
    Task<List<CinemaInfoEntity>> GetNearestCinemasAsync();
    Task<List<MovieInfoEntity>> GetActiveMoviesAsync(DateTime nowUtc);
    Task<List<string>> GetCitiesAsync();
    Task<List<MovieGenreInfoEntity>> GetGenresAsync();
    Task<int> GetNowShowingMoviesCountAsync(string? searchParam);
    Task<List<MovieInfoEntity>> GetNowShowingMoviesPagedAsync(string? searchParam, int skip, int take);
    Task<int> GetComingSoonMoviesCountAsync(string? searchParam);
    Task<List<MovieInfoEntity>> GetComingSoonMoviesPagedAsync(string? searchParam, int skip, int take);
    Task<MovieInfoEntity?> GetMovieDetailAsync(Guid movieId);
}
