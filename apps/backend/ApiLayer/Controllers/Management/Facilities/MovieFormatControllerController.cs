using BusinessLayer.Factories;
using BusinessLayer.Services.FacilitiesManager.MovieInfos;
using BusinessLayer.Services.FacilitiesManager.MovieInfos.MovieFormats;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiLayer.Controllers.Management.Facilities;

[ApiController]
[Route("api/facilities/movie-format")]
[Authorize(Policy = "FacilitiesManager")]
[Tags("Facilities Manager - Movie Format")]
[ApiExplorerSettings(GroupName = "v1-facilities-manager")]
public class MovieFormatController : ControllerBase
{
    private readonly FacilitiesManagerReadMovieFormatService _movieFormatService;

    public MovieFormatController(
        FacilitiesManagerReadMovieFormatService movieFormatService)
    {
        this._movieFormatService = movieFormatService;
    }

    [HttpGet("")]
    public async Task<IActionResult> GetAllMovieFormat()
    {
        var results = await _movieFormatService.ReadAllMovieFormat();
        return Ok(results);
    }
}
