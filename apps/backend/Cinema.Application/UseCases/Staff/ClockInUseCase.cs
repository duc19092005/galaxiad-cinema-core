using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using System.Text.Json;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Staff;
using Cinema.Application.Interfaces.IIdentityAccess;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Utils;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Staff;

public class ClockInUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStaffRepository _repository;
    private readonly IConfiguration _configuration;
    private readonly IJwtService _jwtService;

    public ClockInUseCase(IStaffRepository repository, IConfiguration configuration, IJwtService jwtService,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _configuration = configuration;
        _jwtService = jwtService;
    }

    public async Task<BaseResponse<ResClockInDto>> ExecuteAsync(ReqClockInDto dto)
    {
        // 1. Kiểm tra tài khoản nhân viên
        var staffProfile = await _repository.GetActiveStaffProfileAsync(dto.StaffId);

        if (staffProfile == null)
        {
            throw new AppException("Không tìm thấy nhân viên hoặc tài khoản nhân viên đã bị khóa.", 404, "CLOCK_IN_ERR");
        }

        if (string.IsNullOrEmpty(staffProfile.FaceVector))
        {
            throw new AppException("Nhân viên chưa đăng ký nhận diện khuôn mặt. Vui lòng liên hệ Admin/Quản lý.", 400, "CLOCK_IN_ERR");
        }

        // 2. So khớp khuôn mặt Euclidean Distance
        var aesKey = _configuration["AES_256:Key"];
        var aesIv = _configuration["AES_256:IV"];
        if (string.IsNullOrEmpty(aesKey) || string.IsNullOrEmpty(aesIv))
        {
            throw new AppException("Lỗi cấu hình hệ thống: Thiếu khóa AES-256.", 500, "CLOCK_IN_ERR");
        }

        // Giải mã Face Vector mẫu
        string decryptedVectorJson;
        try
        {
            decryptedVectorJson = AES256Helper.Decrypt(staffProfile.FaceVector, aesKey, aesIv);
        }
        catch (Exception)
        {
            throw new AppException("Lỗi hệ thống khi giải mã khuôn mặt nhân viên.", 500, "CLOCK_IN_ERR");
        }

        var sampleVector = JsonSerializer.Deserialize<float[]>(decryptedVectorJson);
        if (sampleVector == null || sampleVector.Length != 128)
        {
            throw new AppException("Lỗi hệ thống: Dữ liệu khuôn mặt mẫu không hợp lệ.", 500, "CLOCK_IN_ERR");
        }

        if (dto.FaceVector == null || dto.FaceVector.Length != 128)
        {
            throw new AppException("Dữ liệu Face Vector gửi lên không hợp lệ.", 400, "CLOCK_IN_ERR");
        }

        // Tính khoảng cách Euclidean
        double sum = 0;
        for (int i = 0; i < 128; i++)
        {
            double diff = sampleVector[i] - dto.FaceVector[i];
            sum += diff * diff;
        }
        double distance = Math.Sqrt(sum);

        if (distance > 0.6)
        {
            throw new AppException($"Xác thực khuôn mặt thất bại (Độ lệch: {distance:F4} > 0.6).", 400, "CLOCK_IN_ERR");
        }

        // 3. Xác định thời gian Clock-In
        var env = _configuration["ASPNETCORE_ENVIRONMENT"] ?? "Production";
        DateTime clockInTime;

        if (dto.SimulatedDateTime.HasValue && (env.Equals("Development", StringComparison.OrdinalIgnoreCase) || env.Equals("Docker", StringComparison.OrdinalIgnoreCase)))
        {
            clockInTime = dto.SimulatedDateTime.Value;
        }
        else
        {
            clockInTime = DateTime.UtcNow;
        }

        var todayDate = clockInTime.Date;

        // 4. Kiểm tra ca trực được duyệt (Approved) của nhân viên cho ngày hôm nay
        var activeShiftReg = await _repository.GetApprovedShiftRegistrationAsync(dto.StaffId, todayDate);

        if (activeShiftReg == null)
        {
            throw new AppException("Bạn không có lịch trực nào được phê duyệt cho ngày hôm nay.", 400, "CLOCK_IN_ERR");
        }

        // Kiểm tra khung thời gian ca làm việc có khớp với giờ điểm danh không (Cho phép điểm danh sớm tối đa 30 phút và trong suốt ca trực)
        var timeOfDay = clockInTime.TimeOfDay;
        var shiftStart = activeShiftReg.CinemaShiftTemplateEntity.StartTime;
        var shiftEnd = activeShiftReg.CinemaShiftTemplateEntity.EndTime;
        var allowedStart = shiftStart.Subtract(TimeSpan.FromMinutes(30));

        // Nếu ca trực kéo dài qua đêm (ví dụ Start: 22:00, End: 06:00 ngày hôm sau)
        bool isWithinShift;
        if (shiftStart <= shiftEnd)
        {
            isWithinShift = timeOfDay >= allowedStart && timeOfDay <= shiftEnd;
        }
        else
        {
            // Ca qua đêm
            isWithinShift = timeOfDay >= allowedStart || timeOfDay <= shiftEnd;
        }

        if (!isWithinShift)
        {
            throw new AppException($"Thời gian điểm danh không hợp lệ. Ca làm của bạn bắt đầu lúc {shiftStart:hh\\:mm} và kết thúc lúc {shiftEnd:hh\\:mm}.", 400, "CLOCK_IN_ERR");
        }

        // 5. Kiểm tra xem đã điểm danh vào ca trực này trước đó chưa
        var alreadyClockedIn = await _repository.HasActiveWorkingLogAsync(dto.StaffId, todayDate);

        if (alreadyClockedIn)
        {
            throw new AppException("Bạn đã điểm danh vào ca làm việc này rồi và chưa điểm danh ra.", 400, "CLOCK_IN_ERR");
        }

        // 6. Ghi nhận nhật ký bắt đầu ca làm việc
        var salaryPerHour = activeShiftReg.CinemaShiftTemplateEntity.RoleListInfoEntity.SalaryPerHour;
        var workingLog = new StaffWorkingLoggerEntity
        {
            StaffWorkingLoggerId = Guid.NewGuid(),
            StaffId = dto.StaffId,
            RoleId = activeShiftReg.CinemaShiftTemplateEntity.RoleId,
            SalaryPerHour = salaryPerHour,
            WorkingHour = 0,
            StartedShiftTime = clockInTime,
            EndedShiftTime = null,
            WorkingDate = todayDate,
            TotalReceived = 0,
            SalaryTotalLoggerId = null
        };

        await _repository.AddWorkingLogAsync(workingLog);
        await _unitOfWork.SaveChangesAsync();

        // 7. Sinh JWT mới mang danh tính riêng của nhân viên vừa vào ca
        var userRoles = (await _repository.GetUserRoleNamesAsync(dto.StaffId)).ToArray();
        var roleIds = await _repository.GetUserRoleIdsAsync(dto.StaffId);
        var permissions = (await _repository.GetRolePermissionsAsync(roleIds)).ToArray();

        string? jwtKey = _configuration["JWT_Info:Key"];
        string? jwtIss = _configuration["JWT_Info:Iss"];
        string? jwtAud = _configuration["JWT_Info:Aud"];

        if (string.IsNullOrEmpty(jwtKey) || string.IsNullOrEmpty(jwtIss) || string.IsNullOrEmpty(jwtAud))
        {
            throw new AppException("Lỗi cấu hình hệ thống: Thiếu thông tin JWT.", 500, "CLOCK_IN_ERR");
        }

        var userEmail = staffProfile.UserInfoEntity.UserEmail;
        var username = staffProfile.UserInfoEntity.UserName;

        var token = _jwtService.GenerateToken(jwtKey, jwtIss, jwtAud, userEmail, username, dto.StaffId, userRoles, permissions);

        if (string.IsNullOrEmpty(token))
        {
            throw new AppException("Lỗi hệ thống: Không thể tạo Access Token.", 500, "CLOCK_IN_ERR");
        }

        return new BaseResponse<ResClockInDto>
        {
            IsSuccess = true,
            Data = new ResClockInDto
            {
                AccessToken = token,
                StaffName = username
            },
            Message = $"Điểm danh vào ca thành công! Chào mừng {username} vào ca làm việc."
        };
    }
}
