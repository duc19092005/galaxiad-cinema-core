using Cinema.Application.Dtos;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Management.Movies;

/// <summary>
/// Proxy to external public movie APIs (TMDB) for cast / director metadata.
/// </summary>
[ApiController]
[Route("api/movieManager/external")]
[Authorize(Policy = "MovieManager")]
[Tags("Movie Manager - External Metadata")]
[ApiExplorerSettings(GroupName = "v1-movie-manager")]
public class ExternalMovieMetadataController : ControllerBase
{
    private readonly ITmdbMovieClient _tmdb;

    public ExternalMovieMetadataController(ITmdbMovieClient tmdb)
    {
        _tmdb = tmdb;
    }

    /// <summary>Search movies on TMDB by title. Empty q returns popular movies.</summary>
    [HttpGet("movies/search")]
    public async Task<IActionResult> SearchMovies([FromQuery] string? q, CancellationToken ct)
    {
        try
        {
            var data = string.IsNullOrWhiteSpace(q)
                ? await _tmdb.GetPopularMoviesAsync(ct)
                : await _tmdb.SearchMoviesAsync(q, ct);
            return Ok(new BaseResponse<object>
            {
                IsSuccess = true,
                Message = "OK",
                Data = data
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new BaseResponse<object> { IsSuccess = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(502, new BaseResponse<object>
            {
                IsSuccess = false,
                Message = $"TMDB error: {ex.Message}"
            });
        }
    }

    /// <summary>Popular movies for initial picker list.</summary>
    [HttpGet("movies/popular")]
    public async Task<IActionResult> PopularMovies(CancellationToken ct)
    {
        try
        {
            var data = await _tmdb.GetPopularMoviesAsync(ct);
            return Ok(new BaseResponse<object>
            {
                IsSuccess = true,
                Message = "OK",
                Data = data
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new BaseResponse<object> { IsSuccess = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(502, new BaseResponse<object>
            {
                IsSuccess = false,
                Message = $"TMDB error: {ex.Message}"
            });
        }
    }

    /// <summary>Get directors + cast for a TMDB movie id.</summary>
    [HttpGet("movies/{tmdbId:int}/credits")]
    public async Task<IActionResult> GetCredits(int tmdbId, CancellationToken ct)
    {
        try
        {
            var data = await _tmdb.GetMovieCreditsAsync(tmdbId, ct);
            if (data == null)
            {
                return NotFound(new BaseResponse<object> { IsSuccess = false, Message = "Movie not found on TMDB" });
            }
            return Ok(new BaseResponse<object>
            {
                IsSuccess = true,
                Message = "OK",
                Data = data
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new BaseResponse<object> { IsSuccess = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(502, new BaseResponse<object>
            {
                IsSuccess = false,
                Message = $"TMDB error: {ex.Message}"
            });
        }
    }

    /// <summary>Search people (actors/directors) on TMDB by name. Empty q = popular people.</summary>
    [HttpGet("people/search")]
    public async Task<IActionResult> SearchPeople([FromQuery] string? q, [FromQuery] string? role, CancellationToken ct)
    {
        try
        {
            var data = string.IsNullOrWhiteSpace(q)
                ? await _tmdb.GetPopularPeopleAsync(ct)
                : await _tmdb.SearchPeopleAsync(q, ct);

            // Soft rank by role: keep all results but put matching department first
            // so director search and actor search feel different even for same query.
            if (!string.IsNullOrWhiteSpace(role) && data.Count > 0)
            {
                var r = role.Trim().ToLowerInvariant();
                bool Match(string? dept)
                {
                    var d = (dept ?? string.Empty).ToLowerInvariant();
                    if (r is "director" or "directing")
                        return d.Contains("direct");
                    if (r is "actor" or "acting" or "cast")
                        return d.Contains("act");
                    return true;
                }

                data = data
                    .OrderByDescending(p => Match(p.KnownForDepartment))
                    .ThenByDescending(p => p.Popularity)
                    .ToList();
            }

            return Ok(new BaseResponse<object>
            {
                IsSuccess = true,
                Message = "OK",
                Data = data
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new BaseResponse<object> { IsSuccess = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(502, new BaseResponse<object>
            {
                IsSuccess = false,
                Message = $"TMDB error: {ex.Message}"
            });
        }
    }
}
