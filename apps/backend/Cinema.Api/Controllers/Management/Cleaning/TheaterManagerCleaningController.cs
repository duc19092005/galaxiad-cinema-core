using Cinema.Application.Dtos.Cleaning;
using Cinema.Application.UseCases.Cleaning;
using Cinema.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Cinema.Api.Controllers.Management.Cleaning;

/// <summary>Bảng công việc quét dọn phòng chiếu, dành cho quản lý rạp.</summary>
[ApiController]
[Authorize(Policy = "TheaterManager")]
[Route("api/TheaterManager/Cleaning")]
[Route("api/v1/TheaterManager/Cleaning")]
[Tags("Theater Manager - Cleaning Board")]
[ApiExplorerSettings(GroupName = "v1-theater-manager")]
public class TheaterManagerCleaningController : ControllerBase
{
    private readonly GetCleaningBoardUseCase _getCleaningBoardUseCase;
    private readonly AssignCleaningTaskUseCase _assignCleaningTaskUseCase;
    private readonly VerifyCleaningTaskUseCase _verifyCleaningTaskUseCase;
    private readonly GenerateCleaningTasksForShowtimesUseCase _generateCleaningTasksForShowtimesUseCase;

    public TheaterManagerCleaningController(
        GetCleaningBoardUseCase getCleaningBoardUseCase,
        AssignCleaningTaskUseCase assignCleaningTaskUseCase,
        VerifyCleaningTaskUseCase verifyCleaningTaskUseCase,
        GenerateCleaningTasksForShowtimesUseCase generateCleaningTasksForShowtimesUseCase)
    {
        _getCleaningBoardUseCase = getCleaningBoardUseCase;
        _assignCleaningTaskUseCase = assignCleaningTaskUseCase;
        _verifyCleaningTaskUseCase = verifyCleaningTaskUseCase;
        _generateCleaningTasksForShowtimesUseCase = generateCleaningTasksForShowtimesUseCase;
    }

    private Guid GetCurrentUserId()
    {
        var sid = User.FindFirstValue(ClaimTypes.Sid);
        if (string.IsNullOrEmpty(sid) || !Guid.TryParse(sid, out var userId))
            throw new UnauthorizedAccessException("Cannot determine user identity.");
        return userId;
    }

    [HttpGet("{cinemaId:guid}/board")]
    public async Task<IActionResult> GetBoard(Guid cinemaId, [FromQuery] DateTime? date, [FromQuery] CleaningTaskStatus? status)
        => Ok(await _getCleaningBoardUseCase.ExecuteAsync(cinemaId, date, status));

    [HttpPost("tasks/{taskId:guid}/assign")]
    public async Task<IActionResult> AssignTask(Guid taskId, [FromBody] ReqAssignCleaningTaskDto dto)
        => Ok(await _assignCleaningTaskUseCase.ExecuteAsync(taskId, dto));

    [HttpPost("tasks/{taskId:guid}/verify")]
    public async Task<IActionResult> VerifyTask(Guid taskId, [FromBody] ReqVerifyCleaningTaskDto dto)
        => Ok(await _verifyCleaningTaskUseCase.ExecuteAsync(taskId, GetCurrentUserId(), dto));

    /// <summary>Sinh thủ công các nhiệm vụ dọn dẹp cho suất chiếu trong khoảng ngày (thường đã có job tự động chạy hằng đêm).</summary>
    [HttpPost("{cinemaId:guid}/generate-tasks")]
    public async Task<IActionResult> GenerateTasks(Guid cinemaId, [FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
        => Ok(await _generateCleaningTasksForShowtimesUseCase.ExecuteAsync(cinemaId, fromDate, toDate));
}
