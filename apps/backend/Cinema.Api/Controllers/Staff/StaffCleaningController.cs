using Cinema.Application.Dtos.Cleaning;
using Cinema.Application.UseCases.Cleaning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Cinema.Api.Controllers.Staff;

/// <summary>Nhiệm vụ quét dọn của nhân viên vệ sinh (janitor): xem, quét mã bắt đầu, báo hoàn thành.</summary>
[ApiController]
[Authorize]
[Route("api/Staff/Cleaning")]
[Route("api/v1/Staff/Cleaning")]
[Tags("Staff - Cleaning Tasks")]
[ApiExplorerSettings(GroupName = "v1-user")]
public class StaffCleaningController : ControllerBase
{
    private readonly GetMyCleaningTasksUseCase _getMyCleaningTasksUseCase;
    private readonly StartCleaningTaskUseCase _startCleaningTaskUseCase;
    private readonly CompleteCleaningTaskUseCase _completeCleaningTaskUseCase;

    public StaffCleaningController(
        GetMyCleaningTasksUseCase getMyCleaningTasksUseCase,
        StartCleaningTaskUseCase startCleaningTaskUseCase,
        CompleteCleaningTaskUseCase completeCleaningTaskUseCase)
    {
        _getMyCleaningTasksUseCase = getMyCleaningTasksUseCase;
        _startCleaningTaskUseCase = startCleaningTaskUseCase;
        _completeCleaningTaskUseCase = completeCleaningTaskUseCase;
    }

    private Guid GetCurrentUserId()
    {
        var sid = User.FindFirstValue(ClaimTypes.Sid);
        if (string.IsNullOrEmpty(sid) || !Guid.TryParse(sid, out var userId))
            throw new UnauthorizedAccessException("Cannot determine user identity.");
        return userId;
    }

    [HttpGet("my-tasks")]
    public async Task<IActionResult> GetMyTasks([FromQuery] DateTime? date)
        => Ok(await _getMyCleaningTasksUseCase.ExecuteAsync(GetCurrentUserId(), date));

    /// <summary>Quét mã QR/scan sinh trắc học tại phòng chiếu để bắt đầu dọn. Yêu cầu đang trong ca Approved.</summary>
    [HttpPost("tasks/{taskId:guid}/start")]
    public async Task<IActionResult> StartTask(Guid taskId)
        => Ok(await _startCleaningTaskUseCase.ExecuteAsync(taskId, GetCurrentUserId()));

    [HttpPost("tasks/{taskId:guid}/complete")]
    public async Task<IActionResult> CompleteTask(Guid taskId, [FromBody] ReqCompleteCleaningTaskDto dto)
        => Ok(await _completeCleaningTaskUseCase.ExecuteAsync(taskId, GetCurrentUserId(), dto));
}
