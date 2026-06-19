using Cinema.Application.Dtos.TheaterManager.MovieSchedules.Requests;
using Cinema.Application.UseCases.TheaterManager.MovieSchedules;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Management.Theaters;

[ApiController]
[Authorize(Policy = "TheaterManager")]
[Route("api/TheaterManager/MovieSchedules")]
[Tags("Theater Manager - Movie Schedules")]
[ApiExplorerSettings(GroupName = "v1-theater-manager")]
public class TheaterManagerMovieSchedulesController : ControllerBase
{
    private readonly WriteMovieSchedulesUseCase _writeSchedulesUseCase;
    private readonly ReadMovieSchedules _readSchedulesUseCase;

    public TheaterManagerMovieSchedulesController(
        WriteMovieSchedulesUseCase writeSchedulesUseCase,
        ReadMovieSchedules readSchedulesUseCase)
    {
        _writeSchedulesUseCase = writeSchedulesUseCase;
        _readSchedulesUseCase = readSchedulesUseCase;
    }

    [HttpGet("{auditoriumId}")]
    public async Task<IActionResult> GetSchedules(Guid auditoriumId)
    {
        var result = await _readSchedulesUseCase.GetSchedulesByAuditoriumId(auditoriumId);
        return Ok(result);
    }

    [HttpPost()]
    public async Task<IActionResult> CreateSchedule(TheaterManagerAddMovieSchedulesRequest request)
    {
        var result = await _writeSchedulesUseCase.AddItem(request);
        return Ok(result);
    }

    [HttpPut("{auditoriumId}")]
    public async Task<IActionResult> UpdateSchedule(Guid auditoriumId, [FromBody] TheaterManagerEditMovieSchedulesRequest request)
    {
        var result = await _writeSchedulesUseCase.UpdateItem(auditoriumId, request);
        return Ok(result);
    }

    [HttpDelete("{scheduleId}")]
    public async Task<IActionResult> DeleteSchedule(Guid scheduleId)
    {
        var result = await _writeSchedulesUseCase.DeleteItem(scheduleId);
        return Ok(result);
    }
}
