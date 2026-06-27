using Cinema.Application.Dtos.Shifts;
using Cinema.Application.UseCases.Admin;
using Cinema.Application.UseCases.Admin.ShiftSchedules;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Admin;

[ApiController]
[Authorize(Policy = "Admin")]
[Route("api/Admin/Shifts")]
[Route("api/v1/Admin/Shifts")]
[Tags("Admin - Shift Deletion Approvals")]
[ApiExplorerSettings(GroupName = "v1-admin")]
public class AdminShiftController : ControllerBase
{
    private readonly GetPendingDeletionRequestsUseCase _getPendingDeletionRequestsUseCase;
    private readonly ApproveDeletionRequestUseCase _approveDeletionRequestUseCase;
    private readonly RejectDeletionRequestUseCase _rejectDeletionRequestUseCase;

    public AdminShiftController(
        GetPendingDeletionRequestsUseCase getPendingDeletionRequestsUseCase,
        ApproveDeletionRequestUseCase approveDeletionRequestUseCase,
        RejectDeletionRequestUseCase rejectDeletionRequestUseCase)
    {
        _getPendingDeletionRequestsUseCase = getPendingDeletionRequestsUseCase;
        _approveDeletionRequestUseCase = approveDeletionRequestUseCase;
        _rejectDeletionRequestUseCase = rejectDeletionRequestUseCase;
    }

    [HttpGet("pending-deletions")]
    public async Task<IActionResult> GetPendingDeletionRequests()
    {
        var result = await _getPendingDeletionRequestsUseCase.ExecuteAsync();
        return Ok(result);
    }

    [HttpPost("schedules/{id}/approve-deletion")]
    public async Task<IActionResult> ApproveDeletionRequest(Guid id)
    {
        var result = await _approveDeletionRequestUseCase.ExecuteAsync(id);
        return Ok(result);
    }

    [HttpPost("schedules/{id}/reject-deletion")]
    public async Task<IActionResult> RejectDeletionRequest(Guid id)
    {
        var result = await _rejectDeletionRequestUseCase.ExecuteAsync(id);
        return Ok(result);
    }
}
