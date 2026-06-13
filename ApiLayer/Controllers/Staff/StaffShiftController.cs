using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Shifts;
using BusinessLayer.Entities.CinemaInfos;
using BusinessLayer.Entities.UserInfos;
using BusinessLayer.UseCases.Staff;
using Shared.Interfaces.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

using BusinessLayer.Interfaces.IThirdPersonServices;

namespace ApiLayer.Controllers.Staff;

[ApiController]
[Authorize]
[Route("api/Staff/Shifts")]
[Route("api/v1/Staff/Shifts")]
[Tags("Staff - Shift Registration & Attendance (POS)")]
[ApiExplorerSettings(GroupName = "v1-user")]
public class StaffShiftController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly RegisterShiftUseCase _registerShiftUseCase;
    private readonly RegisterFaceUseCase _registerFaceUseCase;
    private readonly ClockInUseCase _clockInUseCase;
    private readonly ClockOutUseCase _clockOutUseCase;
    private readonly ISseNotificationService _sseNotificationService;

    public StaffShiftController(
        IUnitOfWork unitOfWork,
        RegisterShiftUseCase registerShiftUseCase,
        RegisterFaceUseCase registerFaceUseCase,
        ClockInUseCase clockInUseCase,
        ClockOutUseCase clockOutUseCase,
        ISseNotificationService sseNotificationService)
    {
        _unitOfWork = unitOfWork;
        _registerShiftUseCase = registerShiftUseCase;
        _registerFaceUseCase = registerFaceUseCase;
        _clockInUseCase = clockInUseCase;
        _clockOutUseCase = clockOutUseCase;
        _sseNotificationService = sseNotificationService;
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

    // 1. Xem danh sách Ca làm mẫu trống tại rạp của mình (Phục vụ nhân viên đăng ký ca)
    [HttpGet("available")]
    public async Task<IActionResult> GetAvailableShifts([FromQuery] DateTime date)
    {
        var staffId = GetCurrentUserId();

        var staffProfile = await _unitOfWork.Repository<StaffProfileEntity>().Query()
            .FirstOrDefaultAsync(s => s.UserId == staffId && s.WorkingStatus);

        if (staffProfile == null)
        {
            return BadRequest(new BaseResponse<bool> { IsSuccess = false, Message = "Tài khoản của bạn không được gán vào chi nhánh rạp cụ thể." });
        }

        var registrationDateOnly = date.Date;

        // Lấy tất cả các ca trực mẫu đang kích hoạt tại Rạp này
        var templates = await _unitOfWork.Repository<CinemaShiftTemplateEntity>().Query()
            .Include(t => t.RoleListInfoEntity)
            .Where(t => t.CinemaId == staffProfile.CinemaId && t.IsActive)
            .ToListAsync();

        var resultList = new List<ResShiftTemplateDto>();

        foreach (var t in templates)
        {
            // Đếm số lượng nhân viên đã đăng ký thành công hoặc đang chờ duyệt ca này trong ngày
            var count = await _unitOfWork.Repository<StaffShiftRegistrationEntity>().Query()
                .CountAsync(r => r.ShiftTemplateId == t.ShiftTemplateId 
                                 && r.RegistrationDate == registrationDateOnly 
                                 && (r.Status == "Approved" || r.Status == "Pending"));

            resultList.Add(new ResShiftTemplateDto
            {
                ShiftTemplateId = t.ShiftTemplateId,
                CinemaId = t.CinemaId,
                CinemaName = t.CinemaInfoEntity?.CinemaName ?? "",
                ShiftName = t.ShiftName,
                StartTime = t.StartTime,
                EndTime = t.EndTime,
                MaxStaff = t.MaxStaff,
                RegisteredCount = count,
                RoleId = t.RoleId,
                RoleName = t.RoleListInfoEntity.RoleName
            });
        }

        return Ok(new BaseResponse<List<ResShiftTemplateDto>> { IsSuccess = true, Data = resultList });
    }

    // 2. Nhân viên tự đăng ký ca trực
    [HttpPost("register")]
    public async Task<IActionResult> RegisterShift([FromBody] ReqRegisterShiftDto dto)
    {
        var staffId = GetCurrentUserId();
        var result = await _registerShiftUseCase.ExecuteAsync(staffId, dto);
        return Ok(result);
    }

    // 3. Xem danh sách ca làm việc đã đăng ký của cá nhân nhân viên
    [HttpGet("my-registrations")]
    public async Task<IActionResult> GetMyRegistrations()
    {
        var staffId = GetCurrentUserId();

        var list = await _unitOfWork.Repository<StaffShiftRegistrationEntity>().Query()
            .Include(r => r.CinemaShiftTemplateEntity)
            .Where(r => r.StaffId == staffId)
            .OrderByDescending(r => r.RegistrationDate)
            .Select(r => new ResStaffShiftRegistrationDto
            {
                ShiftRegistrationId = r.ShiftRegistrationId,
                StaffId = r.StaffId,
                StaffName = r.StaffProfileEntity.UserInfoEntity.UserName,
                ShiftTemplateId = r.ShiftTemplateId,
                ShiftName = r.CinemaShiftTemplateEntity.ShiftName,
                StartTime = r.CinemaShiftTemplateEntity.StartTime,
                EndTime = r.CinemaShiftTemplateEntity.EndTime,
                RegistrationDate = r.RegistrationDate,
                Status = r.Status,
                ApprovedAt = r.ApprovedAt,
                Notes = r.Notes
            })
            .ToListAsync();

        return Ok(new BaseResponse<List<ResStaffShiftRegistrationDto>> { IsSuccess = true, Data = list });
    }

    // 4. Đăng ký/Chụp ảnh chân dung mẫu lưu khuôn mặt (Face Vector)
    [HttpPost("{staffId}/register-face")]
    public async Task<IActionResult> RegisterFace(Guid staffId, [FromBody] ReqRegisterFaceDto dto)
    {
        var operatorId = GetCurrentUserId();
        var result = await _registerFaceUseCase.ExecuteAsync(staffId, operatorId, dto);
        return Ok(result);
    }

    // 5. Vào ca trực (Clock-In) bằng nhận dạng khuôn mặt (Gửi từ tài khoản POS chung)
    [AllowAnonymous]
    [HttpPost("clock-in")]
    public async Task<IActionResult> ClockIn([FromBody] ReqClockInDto dto)
    {
        var result = await _clockInUseCase.ExecuteAsync(dto);
        return Ok(result);
    }

    // 6. Ra ca trực (Clock-Out) - Thực hiện dưới JWT cá nhân
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

        var history = await _unitOfWork.Repository<StaffWorkingLoggerEntity>().Query()
            .Include(l => l.RoleListInfoEntity)
            .Where(l => l.StaffId == staffId)
            .OrderByDescending(l => l.WorkingDate)
            .ThenByDescending(l => l.StartedShiftTime)
            .ToListAsync();

        return Ok(new BaseResponse<List<StaffWorkingLoggerEntity>> { IsSuccess = true, Data = history });
    }

    // 8. Xem lịch sử bảng lương của chính mình
    [HttpGet("my-payroll")]
    public async Task<IActionResult> GetMyPayroll()
    {
        var staffId = GetCurrentUserId();

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
                StaffName = p.StaffProfileEntity.UserInfoEntity.UserName,
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

    // 9. Nhận thông báo trực quan thời gian thực qua Server-Sent Events (SSE)
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
