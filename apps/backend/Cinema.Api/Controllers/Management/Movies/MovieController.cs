using Cinema.Application.UseCases.MovieManager.MovieInfos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Management.Movies;

[ApiController]
[Route("api/movieManager/movies")]
[Authorize(Policy = "MovieManager")]
[Tags("Movie Manager - Movies")]
[ApiExplorerSettings(GroupName = "v1-movie-manager")]
public class MovieController : ControllerBase
{
    private readonly GetMovieInfosUseCase _getMovieInfosUseCase;
    private readonly GetMovieInfoByIdUseCase _getMovieInfoByIdUseCase;

    public MovieController(
        GetMovieInfosUseCase getMovieInfosUseCase,
        GetMovieInfoByIdUseCase getMovieInfoByIdUseCase)
    {
        _getMovieInfosUseCase = getMovieInfosUseCase;
        _getMovieInfoByIdUseCase = getMovieInfoByIdUseCase;
    }

    [HttpPost("")]
    [Obsolete("Direct movie mutation is disabled. Activate an approved film contract instead.")]
    public IActionResult CreateMovie() => DirectMutationDisabled();

    [HttpPut("{movieId}")]
    [Obsolete("Direct movie mutation is disabled. Submit a movie change request instead.")]
    public IActionResult UpdateMovie(Guid movieId) => DirectMutationDisabled();

    [HttpDelete("{movieId}")]
    [Obsolete("Movies with contractual, schedule, ticket, and revenue history cannot be deleted directly.")]
    public IActionResult DeleteMovie(Guid movieId) => DirectMutationDisabled();

    [HttpPatch("{movieId}/status")]
    [Obsolete("Movie availability is derived from approved exhibition rights and schedules.")]
    public IActionResult SetMovieStatus(Guid movieId) => DirectMutationDisabled();

    [HttpGet("")]
    public async Task<IActionResult> GetAllMovies([FromQuery] Guid? cinemaId)
    {
        var results = await _getMovieInfosUseCase.ExecuteAsync(cinemaId);
        return Ok(results);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetMovieById(Guid id)
    {
        var results = await _getMovieInfoByIdUseCase.ExecuteAsync(id);
        return Ok(results);
    }

    private ObjectResult DirectMutationDisabled() => StatusCode(StatusCodes.Status410Gone, new
    {
        isSuccess = false,
        errorCode = "MOVIE_DIRECT_MUTATION_DISABLED",
        message = "Không thể thay đổi phim trực tiếp. Hãy dùng hợp đồng đã duyệt hoặc yêu cầu điều chỉnh phim."
    });
}
