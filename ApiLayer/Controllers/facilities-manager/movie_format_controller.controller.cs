using BussinessLayer.Factories;
using BussinessLayer.Services.facilities_manager.Movie_Infos.Movie_format;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers.facilities_manager;

[ApiController]
[Route("api/facilities/movie-format")]
[Authorize(Policy = "FacilitiesManager")]
[Tags("FacilitiesManager - Movie Format")]
[ApiExplorerSettings(GroupName = "v1-facilities-manager")]
public class movie_format_controller : ControllerBase
{
    private readonly facilitiesManagerReadMovieFormatService facilities_manager_read_movie_format_service;

    public movie_format_controller(
        facilitiesManagerReadMovieFormatService facilities_manager_read_movie_format_service)
    {
        this.facilities_manager_read_movie_format_service =  facilities_manager_read_movie_format_service;
    }

    [HttpGet("")]
    public async Task<IActionResult> getAllMovieFormat()
    {
        var results = await facilities_manager_read_movie_format_service.ReadAllMovieFormat();
        return Ok(results);
    }
}