using Cinema.Application.Dtos.MovieManager.Requests;
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
    private readonly CreateMovieUseCase _createMovieUseCase;
    private readonly UpdateMovieUseCase _updateMovieUseCase;
    private readonly GetMovieInfosUseCase _getMovieInfosUseCase;
    private readonly GetMovieInfoByIdUseCase _getMovieInfoByIdUseCase;

    public MovieController(
        CreateMovieUseCase createMovieUseCase,
        UpdateMovieUseCase updateMovieUseCase,
        GetMovieInfosUseCase getMovieInfosUseCase,
        GetMovieInfoByIdUseCase getMovieInfoByIdUseCase)
    {
        _createMovieUseCase = createMovieUseCase;
        _updateMovieUseCase = updateMovieUseCase;
        _getMovieInfosUseCase = getMovieInfosUseCase;
        _getMovieInfoByIdUseCase = getMovieInfoByIdUseCase;
    }

    [HttpPost("")]
    public async Task<IActionResult> CreateMovie(ReqAddMovieManagerMovieDto request)
    {
        var results = await _createMovieUseCase.ExecuteAsync(request);
        return Ok(results);
    }

    [HttpPut("{movieId}")]
    public async Task<IActionResult> UpdateMovie(Guid movieId, ReqEditMovieManagerMovieDto request)
    {
        var results = await _updateMovieUseCase.ExecuteAsync(movieId, request);
        return Ok(results);
    }

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
}
