using BusinessLayer.Dtos.MovieManager;
using BusinessLayer.Services.MovieManager;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace ApiLayer.Controllers.MovieManager;

[ApiController]
[Route("api/movieManager/movies")]
[Authorize(Policy = "MovieManager")]
[Tags("movie Manager - Movies")]
[ApiExplorerSettings(GroupName = "v1-movie-manager")]
public class movieController : ControllerBase
{
    private readonly MovieManagerWriteMovieService movieManagerWriteMovieService;

    private readonly MovieManagerReadMovie _movieManagerReadMovie ;

    public movieController(MovieManagerWriteMovieService movieManagerWriteMovieService 
    ,MovieManagerReadMovie movieManagerReadMovie)
    {
        this.movieManagerWriteMovieService = movieManagerWriteMovieService;
        this._movieManagerReadMovie = movieManagerReadMovie;
    }

    [HttpPost("")]
    public async Task<IActionResult> CreateMovie(ReqAddMovieManagerMovieDto request)
    {
        Console.WriteLine("Ended At " + request.EndedDate);
        Console.WriteLine("Started At " + request.StartedDate);
        var results = await movieManagerWriteMovieService.AddItem(request);
        return Ok(results);
    }

    [HttpPut("{movieId}")]
    public async Task<IActionResult> UpdateMovie(Guid movieId, ReqEditMovieManagerMovieDto request)
    {
        var results = await movieManagerWriteMovieService.UpdateItem(movieId, request);
        return Ok(results);
    }

    [HttpGet("")]
    public async Task<IActionResult> GetAllMovies()
    {
        var results = await _movieManagerReadMovie.GetAllMovieInfos();
        return Ok(results);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetMovieById(Guid id)
    {
        var results = await _movieManagerReadMovie.GetMovieByMovieId(id);
        return Ok(results);
    }
}

