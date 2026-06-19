using Cinema.Application.Dtos.Shifts;
using Cinema.Application.UseCases.TheaterManager;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Cinema.Api.Controllers.Management.Theaters;

[ApiController]
[Authorize(Policy = "TheaterManager")]
[Route("api/TheaterManager/Shifts")]
[Route("api/v1/TheaterManager/Shifts")]
[Tags("Theater Manager - Shift & Personnel Management")]
[ApiExplorerSettings(GroupName = "v1-theater-manager")]
public class TheaterManagerShiftController : ControllerBase
{
    private readonly ApproveShiftRegistrationUseCase _approveShiftRegistrationUseCase;
    private readonly CalculatePayrollUseCase _calculatePayrollUseCase;
    private readonly CreateShiftTemplateUseCase _createShiftTemplateUseCase;
    private readonly GetShiftTemplatesUseCase _getShiftTemplatesUseCase;
    private readonly GetShiftRegistrationsUseCase _getShiftRegistrationsUseCase;
    private readonly GetStaffProfilesUseCase _getStaffProfilesUseCase;
    private readonly UpdateStaffProfileUseCase _updateStaffProfileUseCase;
    private readonly GetStaffPayrollUseCase _getStaffPayrollUseCase;
    private readonly GetCinemaPayrollUseCase _getCinemaPayrollUseCase;

    public TheaterManagerShiftController(
        ApproveShiftRegistrationUseCase approveShiftRegistrationUseCase,
        CalculatePayrollUseCase calculatePayrollUseCase,
        CreateShiftTemplateUseCase createShiftTemplateUseCase,
        GetShiftTemplatesUseCase getShiftTemplatesUseCase,
        GetShiftRegistrationsUseCase getShiftRegistrationsUseCase,
        GetStaffProfilesUseCase getStaffProfilesUseCase,
        UpdateStaffProfileUseCase updateStaffProfileUseCase,
        GetStaffPayrollUseCase getStaffPayrollUseCase,
        GetCinemaPayrollUseCase getCinemaPayrollUseCase)
    {
        _approveShiftRegistrationUseCase = approveShiftRegistrationUseCase;
        _calculatePayrollUseCase = calculatePayrollUseCase;
        _createShiftTemplateUseCase = createShiftTemplateUseCase;
        _getShiftTemplatesUseCase = getShiftTemplatesUseCase;
        _getShiftRegistrationsUseCase = getShiftRegistrationsUseCase;
        _getStaffProfilesUseCase = getStaffProfilesUseCase;
        _updateStaffProfileUseCase = updateStaffProfileUseCase;
        _getStaffPayrollUseCase = getStaffPayrollUseCase;
        _getCinemaPayrollUseCase = getCinemaPayrollUseCase;
    }

    private Guid GetCurrentUserId()
    {
        var sid = User.FindFirstValue(ClaimTypes.Sid);
        if (string.IsNullOrEmpty(sid) || !Guid.TryParse(sid, out var userId))
            throw new UnauthorizedAccessException("Không xác định được danh tính người dùng.");
        return userId;
    }

    // 1. Tạo Mẫu ca trực mới
    [HttpPost("templates")]
    public async Task<IActionResult> CreateShiftTemplate([FromBody] ReqCreateShiftTemplateDto dto)
    {
        var result = await _createShiftTemplateUseCase.ExecuteAsync(dto);
        return result.IsSuccess ? Ok(result) : Forbid();
    }

    // 2. Lấy danh sách mẫu ca trực
    [HttpGet("templates")]
    public async Task<IActionResult> GetShiftTemplates([FromQuery] Guid cinemaId)
    {
        var result = await _getShiftTemplatesUseCase.ExecuteAsync(cinemaId);
        return Ok(result);
    }

    // 3. Lấy danh sách đăng ký ca trực (phục vụ duyệt ca)
    [HttpGet("registrations")]
    public async Task<IActionResult> GetShiftRegistrations([FromQuery] Guid cinemaId, [FromQuery] string? status)
    {
        var result = await _getShiftRegistrationsUseCase.ExecuteAsync(cinemaId, status);
        return result.IsSuccess ? Ok(result) : Forbid();
    }

    // 4. Phê duyệt ca trực
    [HttpPost("registrations/{id}/approve")]
    public async Task<IActionResult> ApproveShift(Guid id, [FromBody] ReqApproveShiftDto dto)
    {
        var managerId = GetCurrentUserId();
        var result = await _approveShiftRegistrationUseCase.ApproveAsync(id, managerId, dto.Notes);
        return Ok(result);
    }

    // 5. Từ chối duyệt ca trực
    [HttpPost("registrations/{id}/reject")]
    public async Task<IActionResult> RejectShift(Guid id, [FromBody] ReqApproveShiftDto dto)
    {
        var managerId = GetCurrentUserId();
        var result = await _approveShiftRegistrationUseCase.RejectAsync(id, managerId, dto.Notes);
        return Ok(result);
    }

    // 6. Hủy ca trực đã duyệt
    [HttpPost("registrations/{id}/cancel")]
    public async Task<IActionResult> CancelShift(Guid id, [FromBody] ReqApproveShiftDto dto)
    {
        var managerId = GetCurrentUserId();
        var result = await _approveShiftRegistrationUseCase.CancelApprovedAsync(id, managerId, dto.Notes);
        return Ok(result);
    }

    // 7. Gán trực tiếp nhân viên vào ca trực
    [HttpPost("assign")]
    public async Task<IActionResult> AssignShift([FromBody] ReqAssignShiftDto dto)
    {
        var managerId = GetCurrentUserId();
        var result = await _approveShiftRegistrationUseCase.AssignDirectlyAsync(
            dto.StaffId, dto.ShiftTemplateId, dto.RegistrationDate, managerId);
        return Ok(result);
    }

    // 8. Lấy danh sách hồ sơ nhân viên thuộc Rạp
    [HttpGet("staff-profiles")]
    public async Task<IActionResult> GetStaffProfiles([FromQuery] Guid cinemaId)
    {
        var result = await _getStaffProfilesUseCase.ExecuteAsync(cinemaId);
        return result.IsSuccess ? Ok(result) : Forbid();
    }

    // 9. Cập nhật hồ sơ nhân viên
    [HttpPut("staff-profiles/{id}")]
    public async Task<IActionResult> UpdateStaffProfile(Guid id, [FromBody] ReqUpdateStaffProfileDto dto)
    {
        var result = await _updateStaffProfileUseCase.ExecuteAsync(id, dto);
        if (!result.IsSuccess && result.Message?.Contains("Không tìm thấy") == true)
            return NotFound(result);
        return result.IsSuccess ? Ok(result) : Forbid();
    }

    // 10. Tính toán bảng lương tích lũy
    [HttpPost("payroll/calculate")]
    public async Task<IActionResult> CalculatePayroll([FromBody] ReqCalculatePayrollDto dto)
    {
        var managerId = GetCurrentUserId();
        var result = await _calculatePayrollUseCase.CalculateAsync(dto, managerId);
        return Ok(result);
    }

    // 11. Xác nhận thanh toán tiền lương
    [HttpPost("payroll/{id}/pay")]
    public async Task<IActionResult> PayPayroll(Guid id)
    {
        var managerId = GetCurrentUserId();
        var result = await _calculatePayrollUseCase.PayAsync(id, managerId);
        return Ok(result);
    }

    // 12. Xem lịch sử bảng lương của một nhân viên
    [HttpGet("payroll/staff/{staffId}")]
    public async Task<IActionResult> GetStaffPayroll(Guid staffId)
    {
        var result = await _getStaffPayrollUseCase.ExecuteAsync(staffId);
        if (!result.IsSuccess && result.Message?.Contains("Không tìm thấy") == true)
            return NotFound(result);
        return result.IsSuccess ? Ok(result) : Forbid();
    }

    // 13. Xem toàn bộ bảng lương của tất cả nhân sự thuộc Rạp
    [HttpGet("payroll/cinema/{cinemaId}")]
    public async Task<IActionResult> GetCinemaPayroll(Guid cinemaId)
    {
        var result = await _getCinemaPayrollUseCase.ExecuteAsync(cinemaId);
        return result.IsSuccess ? Ok(result) : Forbid();
    }
}
