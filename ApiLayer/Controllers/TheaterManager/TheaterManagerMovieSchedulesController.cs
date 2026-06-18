using Application.TheaterManager.UseCases;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.TheaterManager.MovieSchedules.Requests;
using BusinessLayer.Services.IdentityAccess;
using BusinessLayer.Services.TheaterManager.MovieSchedules;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Shared.Localization;

namespace ApiLayer.Controllers.TheaterManager;

[ApiController]
[Authorize(Policy = "TheaterManager")]
[Route("api/TheaterManager/MovieSchedules")]
[Tags("Theater Manager - Movie Schedules")]
[ApiExplorerSettings(GroupName = "v1-theater-manager")]
public class TheaterManagerMovieSchedules : ControllerBase
{
    private readonly TheaterManagerReadSchedulesService _theaterManagerReadSchedulesService;
    private readonly WriteScheduleUseCase _writeScheduleUseCase;
    private readonly IUserContextService _userContextService;

    public TheaterManagerMovieSchedules(
        TheaterManagerReadSchedulesService theaterManagerReadSchedulesService,
        WriteScheduleUseCase writeScheduleUseCase,
        IUserContextService userContextService)
    {
        _theaterManagerReadSchedulesService = theaterManagerReadSchedulesService;
        _writeScheduleUseCase = writeScheduleUseCase;
        _userContextService = userContextService;
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
        var userId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var command = new CreateScheduleCommand(
            request.AuditoriumId,
            request.Slots.Select(s => new SlotInput(s.ScheduleId, s.MovieId, s.FormatId, s.StartedDate)).ToList());

        var added = await _writeScheduleUseCase.CreateAsync(command, userId, isAdmin);

        return Ok(new BaseResponse<string>
        {
            IsSuccess = true,
            Message = added > 0 ? Messages.Schedule.CreateCompleted : "No new schedules to add."
        });
    }

    [HttpPut("{auditoriumId}")]
    public async Task<IActionResult> UpdateSchedule(Guid auditoriumId, [FromBody] TheaterManagerEditMovieSchedulesRequest request)
    {
        var userId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var command = new UpdateScheduleCommand(
            auditoriumId,
            (request.Slots ?? new List<SchedulesInfos>())
                .Select(s => new SlotInput(s.ScheduleId, s.MovieId, s.FormatId, s.StartedDate)).ToList());

        await _writeScheduleUseCase.UpdateAsync(command, userId, isAdmin);

        return Ok(new BaseResponse<string> { IsSuccess = true, Message = Messages.Schedule.CreateCompleted });
    }

    [HttpDelete("{scheduleId}")]
    public async Task<IActionResult> DeleteSchedule(Guid scheduleId)
    {
        var userId = _userContextService.GetUserId();
        await _writeScheduleUseCase.DeleteAsync(scheduleId, userId);
        return Ok(new BaseResponse<string> { IsSuccess = true, Message = "Xóa lịch chiếu thành công." });
    }
}