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
    private readonly CreateMovieScheduleUseCase _createScheduleUseCase;
    private readonly UpdateMovieScheduleUseCase _updateScheduleUseCase;
    private readonly DeleteMovieScheduleUseCase _deleteScheduleUseCase;
    private readonly ReadMovieSchedules _readSchedulesUseCase;

    public TheaterManagerMovieSchedulesController(
        CreateMovieScheduleUseCase createScheduleUseCase,
        UpdateMovieScheduleUseCase updateScheduleUseCase,
        DeleteMovieScheduleUseCase deleteScheduleUseCase,
        ReadMovieSchedules readSchedulesUseCase)
    {
        _createScheduleUseCase = createScheduleUseCase;
        _updateScheduleUseCase = updateScheduleUseCase;
        _deleteScheduleUseCase = deleteScheduleUseCase;
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
        var result = await _createScheduleUseCase.ExecuteAsync(request);
        return Ok(result);
    }

    [HttpPut("{auditoriumId}")]
    public async Task<IActionResult> UpdateSchedule(Guid auditoriumId, [FromBody] TheaterManagerEditMovieSchedulesRequest request)
    {
        var result = await _updateScheduleUseCase.ExecuteAsync(auditoriumId, request);
        return Ok(result);
    }

    [HttpDelete("{scheduleId}")]
    public async Task<IActionResult> DeleteSchedule(Guid scheduleId)
    {
        var result = await _deleteScheduleUseCase.ExecuteAsync(scheduleId);
        return Ok(result);
    }
}
