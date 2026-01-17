using BussinessLayer.Dtos.Movie_Manager;
using BussinessLayer.Services.Movie_manager;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers.movie_manager;

[ApiController]
[Route("api/movieManager/movies")]
[Authorize(Policy = "MovieManager")]
[Tags("movie Manager - Movies")]
[ApiExplorerSettings(GroupName = "v1-movie-manager")]
public class movieController : ControllerBase
{
    private readonly movieManagerWriteMovieService movieManagerWriteMovieService;

    public movieController(movieManagerWriteMovieService movieManagerWriteMovieService)
    {
        this.movieManagerWriteMovieService = movieManagerWriteMovieService;
    }

    [HttpPost("")]
    public async Task<IActionResult> createMovie(reqAddMovieManagerMovieDto request)
    {
        var results = await movieManagerWriteMovieService.AddItem(request);
        return Ok(results);
    }
}