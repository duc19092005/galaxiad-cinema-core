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

    public movieController(MovieManagerWriteMovieService movieManagerWriteMovieService)
    {
        this.movieManagerWriteMovieService = movieManagerWriteMovieService;
    }

    [HttpPost("")]
    public async Task<IActionResult> CreateMovie(ReqAddMovieManagerMovieDto request)
    {
        var results = await movieManagerWriteMovieService.AddItem(request);
        return Ok(results);
    }

    [HttpPut("{movieId}")]
    public async Task<IActionResult> UpdateMovie(Guid movieId, ReqEditMovieManagerMovieDto request)
    {
        var results = await movieManagerWriteMovieService.UpdateItem(movieId, request);
        return Ok(results);
    }
}

