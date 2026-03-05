using BusinessLayer.Dtos.TheaterManager.MovieSchedules.Requests;
using BusinessLayer.Services.TheaterManager.MovieSchedules;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace ApiLayer.Controllers.TheaterManager;

[ApiController]
[Authorize(Policy = "TheaterManager")]
[Route("api/TheaterManager/MovieSchedules")]
[Tags("Theater Manager - Movie Schedules")]
[ApiExplorerSettings(GroupName = "v1-theater-manager")]
public class TheaterManagerMovieSchedules : ControllerBase
{
    private readonly TheaterManagerWriteSchedulesService _theaterManagerWriteSchedulesService;

    public TheaterManagerMovieSchedules(TheaterManagerWriteSchedulesService theaterManagerWriteSchedulesService)
    {
        this._theaterManagerWriteSchedulesService = theaterManagerWriteSchedulesService;
    }

    [HttpPost()]
    public async Task<IActionResult> CreateSchedule(TheaterManagerAddMovieSchedulesRequest request)
    {
        var result = await _theaterManagerWriteSchedulesService.AddItem(request);
        return Ok(result);
    }

}