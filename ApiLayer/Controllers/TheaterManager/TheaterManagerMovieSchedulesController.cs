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
    private readonly TheaterManagerReadSchedulesService _theaterManagerReadSchedulesService;

    public TheaterManagerMovieSchedules(TheaterManagerWriteSchedulesService theaterManagerWriteSchedulesService, 
                                        TheaterManagerReadSchedulesService theaterManagerReadSchedulesService)
    {
        _theaterManagerWriteSchedulesService = theaterManagerWriteSchedulesService;
        _theaterManagerReadSchedulesService = theaterManagerReadSchedulesService;
    }

    [HttpGet("{auditoriumId}")]
    public async Task<IActionResult> GetSchedules(Guid auditoriumId)
    {
        var result = await _theaterManagerReadSchedulesService.GetSchedulesByAuditoriumId(auditoriumId);
        return Ok(result);
    }

    [HttpPost()]
    public async Task<IActionResult> CreateSchedule(TheaterManagerAddMovieSchedulesRequest request)
    {
        var result = await _theaterManagerWriteSchedulesService.AddItem(request);
        return Ok(result);
    }

    [HttpPut("{auditoriumId}")]
    public async Task<IActionResult> UpdateSchedule(Guid auditoriumId, [FromBody] TheaterManagerEditMovieSchedulesRequest request)
    {
        var result = await _theaterManagerWriteSchedulesService.UpdateItem(auditoriumId, request);
        return Ok(result);
    }

    [HttpDelete("{scheduleId}")]
    public async Task<IActionResult> DeleteSchedule(Guid scheduleId)
    {
        var result = await _theaterManagerWriteSchedulesService.DeleteItem(scheduleId);
        return Ok(result);
    }

}