using Cinema.Application.Dtos.MovieManager.Responses;

namespace Cinema.Application.Interfaces.IThirdPersonServices;

/// <summary>
/// Client for external public movie metadata (TMDB).
/// </summary>
public interface ITmdbMovieClient
{
    Task<List<ExternalMovieSearchItemDto>> SearchMoviesAsync(string query, CancellationToken ct = default);

    Task<List<ExternalMovieSearchItemDto>> GetPopularMoviesAsync(CancellationToken ct = default);

    Task<ExternalMovieCreditsDto?> GetMovieCreditsAsync(int tmdbMovieId, CancellationToken ct = default);

    Task<List<ExternalPersonSearchItemDto>> SearchPeopleAsync(string query, CancellationToken ct = default);

    Task<List<ExternalPersonSearchItemDto>> GetPopularPeopleAsync(CancellationToken ct = default);
}
