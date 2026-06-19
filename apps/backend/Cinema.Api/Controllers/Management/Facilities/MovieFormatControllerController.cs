using Cinema.Application.UseCases.FacilitiesManager.MovieFormat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Management.Facilities;

[ApiController]
[Route("api/facilities/movie-format")]
[Authorize(Policy = "FacilitiesManager")]
[Tags("Facilities Manager - Movie Format")]
[ApiExplorerSettings(GroupName = "v1-facilities-manager")]
public class MovieFormatController : ControllerBase
{
    private readonly FacilitiesManagerReadMovieFormatUseCase _readMovieFormatUseCase;

    public MovieFormatController(FacilitiesManagerReadMovieFormatUseCase readMovieFormatUseCase)
    {
        _readMovieFormatUseCase = readMovieFormatUseCase;
    }

    [HttpGet("")]
    public async Task<IActionResult> GetAllMovieFormat()
    {
        var results = await _readMovieFormatUseCase.GetAll();
        return Ok(results);
    }
}
