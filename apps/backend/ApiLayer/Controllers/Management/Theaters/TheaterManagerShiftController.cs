using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Shifts;
using BusinessLayer.Entities.CinemaInfos;
using BusinessLayer.Entities.UserInfos;
using BusinessLayer.UseCases.TheaterManager;
using Shared.Interfaces.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ApiLayer.Controllers.Management.Theaters;

[ApiController]
[Authorize(Policy = "TheaterManager")]
[Route("api/TheaterManager/Shifts")]
[Route("api/v1/TheaterManager/Shifts")]
[Tags("Theater Manager - Shift & Personnel Management")]
[ApiExplorerSettings(GroupName = "v1-theater-manager")]
public class TheaterManagerShiftController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ApproveShiftRegistrationUseCase _approveShiftRegistrationUseCase;
    private readonly CalculatePayrollUseCase _calculatePayrollUseCase;

    public TheaterManagerShiftController(
        IUnitOfWork unitOfWork,
        ApproveShiftRegistrationUseCase approveShiftRegistrationUseCase,
        CalculatePayrollUseCase calculatePayrollUseCase)
    {
        _unitOfWork = unitOfWork;
        _approveShiftRegistrationUseCase = approveShiftRegistrationUseCase;
        _calculatePayrollUseCase = calculatePayrollUseCase;
    }

    private Guid GetCurrentUserId()
    {
        var sid = User.FindFirstValue(ClaimTypes.Sid);
        if (string.IsNullOrEmpty(sid) || !Guid.TryParse(sid, out var userId))
        {
            throw new UnauthorizedAccessException("Không xác định được danh tính người dùng.");
        }
        return userId;
    }

    // 1. Tạo Mẫu ca trực mới
    [HttpPost("templates")]
    public async Task<IActionResult> CreateShiftTemplate([FromBody] ReqCreateShiftTemplateDto dto)
    {
        var managerId = GetCurrentUserId();

        // Kiểm tra quyền đối với Rạp này
        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin)
        {
            var managerProfile = await _unitOfWork.Repository<StaffProfileEntity>().Query()
                .FirstOrDefaultAsync(s => s.UserId == managerId && s.WorkingStatus);
            if (managerProfile == null || managerProfile.CinemaId != dto.CinemaId)
            {
                return Forbid("Bạn không có quyền quản lý ca trực cho rạp này.");
            }
        }

        var newTemplate = new CinemaShiftTemplateEntity
        {
            ShiftTemplateId = Guid.NewGuid(),
            CinemaId = dto.CinemaId,
            ShiftName = dto.ShiftName,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            MaxStaff = dto.MaxStaff,
            RoleId = dto.RoleId,
            IsActive = true
        };

        await _unitOfWork.Repository<CinemaShiftTemplateEntity>().AddAsync(newTemplate);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new BaseResponse<CinemaShiftTemplateEntity>
        {
            IsSuccess = true,
            Data = newTemplate,
            Message = "Tạo ca trực mẫu thành công."
        });
    }

    // 2. Lấy danh sách mẫu ca trực
    [HttpGet("templates")]
    public async Task<IActionResult> GetShiftTemplates([FromQuery] Guid cinemaId)
    {
        var templates = await _unitOfWork.Repository<CinemaShiftTemplateEntity>().Query()
            .Include(t => t.RoleListInfoEntity)
            .Where(t => t.CinemaId == cinemaId && t.IsActive)
            .Select(t => new ResShiftTemplateDto
            {
                ShiftTemplateId = t.ShiftTemplateId,
                CinemaId = t.CinemaId,
                CinemaName = t.CinemaInfoEntity != null ? t.CinemaInfoEntity.CinemaName : "",
                ShiftName = t.ShiftName,
                StartTime = t.StartTime,
                EndTime = t.EndTime,
                MaxStaff = t.MaxStaff,
                RoleId = t.RoleId,
                RoleName = t.RoleListInfoEntity != null ? t.RoleListInfoEntity.RoleName : ""
            })
            .ToListAsync();

        return Ok(new BaseResponse<List<ResShiftTemplateDto>> { IsSuccess = true, Data = templates });
    }

    // 3. Lấy danh sách đăng ký ca trực (phục vụ duyệt ca)
    [HttpGet("registrations")]
    public async Task<IActionResult> GetShiftRegistrations([FromQuery] Guid cinemaId, [FromQuery] string? status)
    {
        var managerId = GetCurrentUserId();
        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin)
        {
            var managerProfile = await _unitOfWork.Repository<StaffProfileEntity>().Query()
                .FirstOrDefaultAsync(s => s.UserId == managerId && s.WorkingStatus);
            if (managerProfile == null || managerProfile.CinemaId != cinemaId)
            {
                return Forbid("Bạn không có quyền xem thông tin nhân sự tại chi nhánh rạp này.");
            }
        }

        var query = _unitOfWork.Repository<StaffShiftRegistrationEntity>().Query()
            .Include(r => r.StaffProfileEntity.UserInfoEntity)
            .Include(r => r.CinemaShiftTemplateEntity)
            .Where(r => r.CinemaShiftTemplateEntity.CinemaId == cinemaId);

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(r => r.Status == status);
        }

        var list = await query
            .OrderByDescending(r => r.RegistrationDate)
            .Select(r => new ResStaffShiftRegistrationDto
            {
                ShiftRegistrationId = r.ShiftRegistrationId,
                StaffId = r.StaffId,
                StaffName = r.StaffProfileEntity != null && r.StaffProfileEntity.UserInfoEntity != null ? r.StaffProfileEntity.UserInfoEntity.UserName : "",
                ShiftTemplateId = r.ShiftTemplateId,
                ShiftName = r.CinemaShiftTemplateEntity != null ? r.CinemaShiftTemplateEntity.ShiftName : "",
                StartTime = r.CinemaShiftTemplateEntity != null ? r.CinemaShiftTemplateEntity.StartTime : default,
                EndTime = r.CinemaShiftTemplateEntity != null ? r.CinemaShiftTemplateEntity.EndTime : default,
                RegistrationDate = r.RegistrationDate,
                Status = r.Status,
                ApprovedAt = r.ApprovedAt,
                Notes = r.Notes
            })
            .ToListAsync();

        return Ok(new BaseResponse<List<ResStaffShiftRegistrationDto>> { IsSuccess = true, Data = list });
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

    // 6. Hủy ca trực đã duyệt (Nhân viên xin nghỉ đột xuất)
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
        var result = await _approveShiftRegistrationUseCase.AssignDirectlyAsync(dto.StaffId, dto.ShiftTemplateId, dto.RegistrationDate, managerId);
        return Ok(result);
    }

    // 8. Lấy danh sách hồ sơ nhân viên thuộc Rạp (Mục đích phân công)
    [HttpGet("staff-profiles")]
    public async Task<IActionResult> GetStaffProfiles([FromQuery] Guid cinemaId)
    {
        var managerId = GetCurrentUserId();
        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin)
        {
            var managerProfile = await _unitOfWork.Repository<StaffProfileEntity>().Query()
                .FirstOrDefaultAsync(s => s.UserId == managerId && s.WorkingStatus);
            if (managerProfile == null || managerProfile.CinemaId != cinemaId)
            {
                return Forbid("Bạn không có quyền quản lý nhân sự tại chi nhánh rạp này.");
            }
        }

        var list = await _unitOfWork.Repository<StaffProfileEntity>().Query()
            .Include(s => s.UserInfoEntity)
            .Where(s => s.CinemaId == cinemaId)
            .Select(s => new ResStaffProfileDto
            {
                UserId = s.UserId,
                UserName = s.UserInfoEntity != null ? s.UserInfoEntity.UserName : "",
                Email = s.UserInfoEntity != null ? s.UserInfoEntity.UserEmail : "",
                PortraitImageUrl = s.UserInfoEntity != null ? s.UserInfoEntity.PortraitImageUrl : null,
                WorkingStatus = s.WorkingStatus,
                CinemaId = s.CinemaId,
                CinemaName = s.CinemaInfoEntity != null ? s.CinemaInfoEntity.CinemaName : "",
                DepartmentId = s.DepartmentId,
                DepartmentName = s.DepartmentEntity != null ? s.DepartmentEntity.DepartmentName : null,
                IsCinemaManager = s.IsCinemaManager,
                HasFaceRegistered = !string.IsNullOrEmpty(s.FaceVector)
            })
            .ToListAsync();

        return Ok(new BaseResponse<List<ResStaffProfileDto>> { IsSuccess = true, Data = list });
    }

    // 9. Cập nhật hồ sơ nhân viên (Sửa / Ngừng hoạt động - Phương án 1)
    [HttpPut("staff-profiles/{id}")]
    public async Task<IActionResult> UpdateStaffProfile(Guid id, [FromBody] ReqUpdateStaffProfileDto dto)
    {
        var managerId = GetCurrentUserId();

        var staff = await _unitOfWork.Repository<StaffProfileEntity>().Query()
            .FirstOrDefaultAsync(s => s.UserId == id);

        if (staff == null)
        {
            return NotFound(new BaseResponse<bool> { IsSuccess = false, Message = "Không tìm thấy nhân viên." });
        }

        // Kiểm tra quyền phê duyệt của quản lý tại rạp của nhân viên
        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin)
        {
            var managerProfile = await _unitOfWork.Repository<StaffProfileEntity>().Query()
                .FirstOrDefaultAsync(s => s.UserId == managerId && s.WorkingStatus);
            if (managerProfile == null || managerProfile.CinemaId != staff.CinemaId)
            {
                return Forbid("Bạn chỉ có quyền cập nhật nhân sự thuộc chi nhánh rạp của mình.");
            }
        }

        staff.WorkingStatus = dto.WorkingStatus;
        staff.CinemaId = dto.CinemaId;
        staff.IsCinemaManager = dto.IsCinemaManager;

        await _unitOfWork.SaveChangesAsync();

        return Ok(new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = "Cập nhật thông tin nhân viên thành công."
        });
    }

    // 10. Tính toán bảng lương tích lũy cho nhân viên
    [HttpPost("payroll/calculate")]
    public async Task<IActionResult> CalculatePayroll([FromBody] ReqCalculatePayrollDto dto)
    {
        var managerId = GetCurrentUserId();
        var result = await _calculatePayrollUseCase.CalculateAsync(dto, managerId);
        return Ok(result);
    }

    // 11. Xác nhận thanh toán tiền lương cho nhân viên
    [HttpPost("payroll/{id}/pay")]
    public async Task<IActionResult> PayPayroll(Guid id)
    {
        var managerId = GetCurrentUserId();
        var result = await _calculatePayrollUseCase.PayAsync(id, managerId);
        return Ok(result);
    }

    // 12. Xem lịch sử bảng lương của một nhân viên cụ thể
    [HttpGet("payroll/staff/{staffId}")]
    public async Task<IActionResult> GetStaffPayroll(Guid staffId)
    {
        var managerId = GetCurrentUserId();

        // Kiểm tra hồ sơ nhân viên để kiểm tra rạp thuộc quyền quản lý
        var staffProfile = await _unitOfWork.Repository<StaffProfileEntity>().Query()
            .FirstOrDefaultAsync(s => s.UserId == staffId && s.WorkingStatus);

        if (staffProfile == null)
        {
            return NotFound(new BaseResponse<bool> { IsSuccess = false, Message = "Không tìm thấy nhân viên." });
        }

        // Quyền quản lý rạp của manager
        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin)
        {
            var managerProfile = await _unitOfWork.Repository<StaffProfileEntity>().Query()
                .FirstOrDefaultAsync(s => s.UserId == managerId && s.WorkingStatus);
            if (managerProfile == null || managerProfile.CinemaId != staffProfile.CinemaId)
            {
                return Forbid("Bạn chỉ có quyền xem thông tin tiền lương của nhân sự thuộc chi nhánh rạp của mình.");
            }
        }

        var list = await _unitOfWork.Repository<StaffSalaryTotalLoggerEntity>().Query()
            .Include(p => p.PaidByUser)
            .Where(p => p.StaffId == staffId)
            .OrderByDescending(p => p.ReceivedDay)
            .Select(p => new ResPayrollDto
            {
                SalaryTotalLoggerId = p.SalaryTotalLoggerId,
                TotalReceived = p.TotalReceived,
                ReceivedDay = p.ReceivedDay,
                StaffId = p.StaffId,
                StaffName = p.StaffProfileEntity != null && p.StaffProfileEntity.UserInfoEntity != null ? p.StaffProfileEntity.UserInfoEntity.UserName : "",
                PaidByUserId = p.PaidByUserId,
                PaidByName = p.PaidByUser != null ? p.PaidByUser.UserName : null,
                PaymentStatus = p.PaymentStatus,
                WorkingLogs = p.StaffWorkingLoggerEntities.Select(l => new ResStaffWorkingLogDto
                {
                    StaffWorkingLoggerId = l.StaffWorkingLoggerId,
                    SalaryPerHour = l.SalaryPerHour,
                    WorkingHour = l.WorkingHour,
                    StartedShiftTime = l.StartedShiftTime,
                    EndedShiftTime = l.EndedShiftTime,
                    WorkingDate = l.WorkingDate,
                    TotalReceived = l.TotalReceived
                }).ToList()
            })
            .ToListAsync();

        return Ok(new BaseResponse<List<ResPayrollDto>> { IsSuccess = true, Data = list });
    }

    // 13. Xem toàn bộ bảng lương của tất cả nhân sự thuộc Rạp
    [HttpGet("payroll/cinema/{cinemaId}")]
    public async Task<IActionResult> GetCinemaPayroll(Guid cinemaId)
    {
        var managerId = GetCurrentUserId();

        // Quyền quản lý rạp của manager
        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin)
        {
            var managerProfile = await _unitOfWork.Repository<StaffProfileEntity>().Query()
                .FirstOrDefaultAsync(s => s.UserId == managerId && s.WorkingStatus);
            if (managerProfile == null || managerProfile.CinemaId != cinemaId)
            {
                return Forbid("Bạn chỉ có quyền xem thông tin tiền lương của nhân sự thuộc chi nhánh rạp của mình.");
            }
        }

        var list = await _unitOfWork.Repository<StaffSalaryTotalLoggerEntity>().Query()
            .Include(p => p.PaidByUser)
            .Include(p => p.StaffProfileEntity.UserInfoEntity)
            .Where(p => p.StaffProfileEntity.CinemaId == cinemaId)
            .OrderByDescending(p => p.ReceivedDay)
            .Select(p => new ResPayrollDto
            {
                SalaryTotalLoggerId = p.SalaryTotalLoggerId,
                TotalReceived = p.TotalReceived,
                ReceivedDay = p.ReceivedDay,
                StaffId = p.StaffId,
                StaffName = p.StaffProfileEntity != null && p.StaffProfileEntity.UserInfoEntity != null ? p.StaffProfileEntity.UserInfoEntity.UserName : "",
                PaidByUserId = p.PaidByUserId,
                PaidByName = p.PaidByUser != null ? p.PaidByUser.UserName : null,
                PaymentStatus = p.PaymentStatus,
                WorkingLogs = p.StaffWorkingLoggerEntities.Select(l => new ResStaffWorkingLogDto
                {
                    StaffWorkingLoggerId = l.StaffWorkingLoggerId,
                    SalaryPerHour = l.SalaryPerHour,
                    WorkingHour = l.WorkingHour,
                    StartedShiftTime = l.StartedShiftTime,
                    EndedShiftTime = l.EndedShiftTime,
                    WorkingDate = l.WorkingDate,
                    TotalReceived = l.TotalReceived
                }).ToList()
            })
            .ToListAsync();

        return Ok(new BaseResponse<List<ResPayrollDto>> { IsSuccess = true, Data = list });
    }
}
