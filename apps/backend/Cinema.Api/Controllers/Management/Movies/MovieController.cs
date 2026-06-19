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
    private readonly WriteMovieInfosUseCase _writeMovieUseCase;
    private readonly ReadMovieInfoUseCase _readMovieUseCase;

    public MovieController(
        WriteMovieInfosUseCase writeMovieUseCase,
        ReadMovieInfoUseCase readMovieUseCase)
    {
        _writeMovieUseCase = writeMovieUseCase;
        _readMovieUseCase = readMovieUseCase;
    }

    [HttpPost("")]
    public async Task<IActionResult> CreateMovie(ReqAddMovieManagerMovieDto request)
    {
        var results = await _writeMovieUseCase.AddItem(request);
        return Ok(results);
    }

    [HttpPut("{movieId}")]
    public async Task<IActionResult> UpdateMovie(Guid movieId, ReqEditMovieManagerMovieDto request)
    {
        var results = await _writeMovieUseCase.UpdateItem(movieId, request);
        return Ok(results);
    }

    [HttpGet("")]
    public async Task<IActionResult> GetAllMovies([FromQuery] Guid? cinemaId)
    {
        var results = await _readMovieUseCase.GetAll(cinemaId);
        return Ok(results);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetMovieById(Guid id)
    {
        var results = await _readMovieUseCase.GetById(id);
        return Ok(results);
    }
}
