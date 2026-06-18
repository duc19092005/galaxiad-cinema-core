using BusinessLayer.Services.TheaterManager;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiLayer.Controllers.TheaterManager;

[ApiController]
[Authorize(Policy = "TheaterManager")]
[Route("api/TheaterManager/Data")]
[Tags("Theater Manager - Data Selection")]
[ApiExplorerSettings(GroupName = "v1-theater-manager")]
public class TheaterManagerDataController : ControllerBase
{
    private readonly TheaterManagerDataService _theaterManagerDataService;

    public TheaterManagerDataController(TheaterManagerDataService theaterManagerDataService)
    {
        _theaterManagerDataService = theaterManagerDataService;
    }

    [HttpGet("movies-with-formats")]
    public async Task<IActionResult> GetMoviesWithFormats([FromQuery] Guid cinemaId)
    {
        var result = await _theaterManagerDataService.GetMoviesWithFormatsAsync(cinemaId);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpGet("my-auditoriums")]
    public async Task<IActionResult> GetMyAuditoriums([FromQuery] Guid? cinemaId)
    {
        var result = await _theaterManagerDataService.GetMyAuditoriumsAsync(cinemaId);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }
}
