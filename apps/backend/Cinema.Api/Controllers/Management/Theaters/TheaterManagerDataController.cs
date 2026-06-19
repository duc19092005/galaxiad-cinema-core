using Cinema.Application.UseCases.TheaterManager;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Management.Theaters;

[ApiController]
[Authorize(Policy = "TheaterManager")]
[Route("api/TheaterManager/Data")]
[Tags("Theater Manager - Data Selection")]
[ApiExplorerSettings(GroupName = "v1-theater-manager")]
public class TheaterManagerDataController : ControllerBase
{
    private readonly GetMoviesWithFormatsUseCase _getMoviesWithFormatsUseCase;
    private readonly GetMyAuditoriumsUseCase _getMyAuditoriumsUseCase;

    public TheaterManagerDataController(
        GetMoviesWithFormatsUseCase getMoviesWithFormatsUseCase,
        GetMyAuditoriumsUseCase getMyAuditoriumsUseCase)
    {
        _getMoviesWithFormatsUseCase = getMoviesWithFormatsUseCase;
        _getMyAuditoriumsUseCase = getMyAuditoriumsUseCase;
    }

    [HttpGet("movies-with-formats")]
    public async Task<IActionResult> GetMoviesWithFormats([FromQuery] Guid cinemaId)
    {
        var result = await _getMoviesWithFormatsUseCase.ExecuteAsync(cinemaId);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpGet("my-auditoriums")]
    public async Task<IActionResult> GetMyAuditoriums([FromQuery] Guid? cinemaId)
    {
        var result = await _getMyAuditoriumsUseCase.ExecuteAsync(cinemaId);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }
}
