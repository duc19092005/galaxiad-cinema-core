using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.UseCases.Staff;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Cinema.Api.Controllers.Staff;

[ApiController]
[Authorize]
[Route("api/Staff/Shifts")]
[Route("api/v1/Staff/Shifts")]
[Tags("Staff - Shift Registration & Attendance (POS)")]
[ApiExplorerSettings(GroupName = "v1-user")]
public class StaffShiftController : ControllerBase
{
    private readonly RegisterShiftUseCase _registerShiftUseCase;
    private readonly RegisterFaceUseCase _registerFaceUseCase;
    private readonly ClockInUseCase _clockInUseCase;
    private readonly ClockOutUseCase _clockOutUseCase;
    private readonly ISseNotificationService _sseNotificationService;
    private readonly GetAvailableShiftsUseCase _getAvailableShiftsUseCase;
    private readonly GetMyRegistrationsUseCase _getMyRegistrationsUseCase;
    private readonly CancelPendingRegistrationUseCase _cancelPendingRegistrationUseCase;
    private readonly BulkCancelPendingRegistrationsUseCase _bulkCancelPendingRegistrationsUseCase;
    private readonly GetMyWorkingHistoryUseCase _getMyWorkingHistoryUseCase;
    private readonly GetMyPayrollUseCase _getMyPayrollUseCase;

    public StaffShiftController(
        RegisterShiftUseCase registerShiftUseCase,
        RegisterFaceUseCase registerFaceUseCase,
        ClockInUseCase clockInUseCase,
        ClockOutUseCase clockOutUseCase,
        ISseNotificationService sseNotificationService,
        GetAvailableShiftsUseCase getAvailableShiftsUseCase,
        GetMyRegistrationsUseCase getMyRegistrationsUseCase,
        CancelPendingRegistrationUseCase cancelPendingRegistrationUseCase,
        BulkCancelPendingRegistrationsUseCase bulkCancelPendingRegistrationsUseCase,
        GetMyWorkingHistoryUseCase getMyWorkingHistoryUseCase,
        GetMyPayrollUseCase getMyPayrollUseCase)
    {
        _registerShiftUseCase = registerShiftUseCase;
        _registerFaceUseCase = registerFaceUseCase;
        _clockInUseCase = clockInUseCase;
        _clockOutUseCase = clockOutUseCase;
        _sseNotificationService = sseNotificationService;
        _getAvailableShiftsUseCase = getAvailableShiftsUseCase;
        _getMyRegistrationsUseCase = getMyRegistrationsUseCase;
        _cancelPendingRegistrationUseCase = cancelPendingRegistrationUseCase;
        _bulkCancelPendingRegistrationsUseCase = bulkCancelPendingRegistrationsUseCase;
        _getMyWorkingHistoryUseCase = getMyWorkingHistoryUseCase;
        _getMyPayrollUseCase = getMyPayrollUseCase;
    }

    private Guid GetCurrentUserId()
    {
        var sid = User.FindFirstValue(ClaimTypes.Sid);
        if (string.IsNullOrEmpty(sid) || !Guid.TryParse(sid, out var userId))
            throw new UnauthorizedAccessException("Cannot determine user identity.");
        return userId;
    }

    // 1. Xem danh sách Ca làm mẫu trống tại rạp của mình
    [HttpGet("available")]
    public async Task<IActionResult> GetAvailableShifts([FromQuery] DateTime date)
    {
        var staffId = GetCurrentUserId();
        var result = await _getAvailableShiftsUseCase.ExecuteAsync(staffId, date);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    // 2. Nhân viên tự đăng ký ca trực
    [HttpPost("register")]
    public async Task<IActionResult> RegisterShift([FromBody] ReqRegisterShiftDto dto)
    {
        var staffId = GetCurrentUserId();
        var result = await _registerShiftUseCase.ExecuteAsync(staffId, dto);
        return Ok(result);
    }

    // 3. Xem danh sách ca làm việc đã đăng ký của cá nhân
    [HttpGet("my-registrations")]
    public async Task<IActionResult> GetMyRegistrations()
    {
        var staffId = GetCurrentUserId();
        var result = await _getMyRegistrationsUseCase.ExecuteAsync(staffId);
        return Ok(result);
    }

    // 3b. Nhân viên tự hủy yêu cầu đăng ký ca làm (Pending only)
    [HttpPost("my-registrations/{id}/cancel")]
    public async Task<IActionResult> CancelPendingRegistration(Guid id)
    {
        var staffId = GetCurrentUserId();
        var result = await _cancelPendingRegistrationUseCase.ExecuteAsync(id, staffId);
        if (!result.IsSuccess && result.Message?.Contains("Không tìm thấy") == true)
            return NotFound(result);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    // 3c. Nhân viên tự hủy nhiều yêu cầu đăng ký ca làm cùng lúc
    [HttpPost("my-registrations/bulk-cancel")]
    public async Task<IActionResult> CancelBulkPendingRegistrations([FromBody] List<Guid> ids)
    {
        var staffId = GetCurrentUserId();
        var result = await _bulkCancelPendingRegistrationsUseCase.ExecuteAsync(ids, staffId);
        if (!result.IsSuccess && result.Message?.Contains("Không tìm thấy") == true)
            return NotFound(result);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    // 4. Đăng ký/Chụp ảnh chân dung mẫu lưu khuôn mặt
    [HttpPost("{staffId}/register-face")]
    public async Task<IActionResult> RegisterFace(Guid staffId, [FromBody] ReqRegisterFaceDto dto)
    {
        var operatorId = GetCurrentUserId();
        var result = await _registerFaceUseCase.ExecuteAsync(staffId, operatorId, dto);
        return Ok(result);
    }

    // 5. Vào ca trực (Clock-In) bằng nhận dạng khuôn mặt
    [AllowAnonymous]
    [HttpPost("clock-in")]
    public async Task<IActionResult> ClockIn([FromBody] ReqClockInDto dto)
    {
        var result = await _clockInUseCase.ExecuteAsync(dto);
        return Ok(result);
    }

    // 6. Ra ca trực (Clock-Out)
    [HttpPost("clock-out")]
    public async Task<IActionResult> ClockOut([FromBody] ReqClockOutDto dto)
    {
        var staffId = GetCurrentUserId();
        var result = await _clockOutUseCase.ExecuteAsync(staffId, dto);
        return Ok(result);
    }

    // 7. Xem lịch sử đi làm chấm công của chính mình
    [HttpGet("my-history")]
    public async Task<IActionResult> GetMyHistory()
    {
        var staffId = GetCurrentUserId();
        var result = await _getMyWorkingHistoryUseCase.ExecuteAsync(staffId);
        return Ok(result);
    }

    // 8. Xem lịch sử bảng lương của chính mình
    [HttpGet("my-payroll")]
    public async Task<IActionResult> GetMyPayroll()
    {
        var staffId = GetCurrentUserId();
        var result = await _getMyPayrollUseCase.ExecuteAsync(staffId);
        return Ok(result);
    }

    // 9. Nhận thông báo trực quan thời gian thực qua SSE
    [HttpGet("notifications/sse")]
    public async Task GetNotificationsSse()
    {
        var userId = GetCurrentUserId();

        Response.Headers.Append("Content-Type", "text/event-stream");
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("Connection", "keep-alive");

        var tcs = new TaskCompletionSource();

        Func<string, Task> onMessage = async (msg) =>
        {
            try
            {
                await Response.WriteAsync($"data: {msg}\n\n");
                await Response.Body.FlushAsync();
            }
            catch
            {
                tcs.TrySetResult();
            }
        };

        _sseNotificationService.Subscribe(userId, onMessage, () => tcs.TrySetResult());

        await onMessage(System.Text.Json.JsonSerializer.Serialize(new { status = "connected", timestamp = DateTime.UtcNow }));

        HttpContext.RequestAborted.Register(() =>
        {
            _sseNotificationService.Unsubscribe(userId, onMessage);
            tcs.TrySetResult();
        });

        await tcs.Task;
        _sseNotificationService.Unsubscribe(userId, onMessage);
    }
}
