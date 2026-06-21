using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.TheaterManager;

public class CalculatePayrollUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IShiftManagerRepository _repository;
    private readonly ISseNotificationService _sseNotificationService;

    public CalculatePayrollUseCase(IShiftManagerRepository repository, ISseNotificationService sseNotificationService,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _sseNotificationService = sseNotificationService;
    }

    // 1. Tính toán lương tích lũy và tạo bản ghi bảng lương (Pending)
    public async Task<BaseResponse<ResPayrollDto>> CalculateAsync(ReqCalculatePayrollDto dto, Guid managerUserId)
    {
        var staffProfile = await _repository.GetStaffProfileWithUserAsync(dto.StaffId);

        if (staffProfile == null)
        {
            throw new AppException("Tài khoản nhân viên không tồn tại hoặc đã ngừng hoạt động.", 404, "PAYROLL_ERR");
        }

        // Kiểm tra quyền của quản lý đối với chi nhánh rạp của nhân viên
        await VerifyManagerPermissionAsync(managerUserId, staffProfile.CinemaId);

        var upToDateOnly = dto.UpToDate.Date;

        // Lấy tất cả các ca làm việc đã hoàn thành (EndedShiftTime != null) của nhân viên này 
        // trước hoặc bằng ngày chỉ định và chưa được tính lương (SalaryTotalLoggerId == null)
        var uncalculatedLogs = await _repository.GetUncalculatedWorkingLogsAsync(dto.StaffId, upToDateOnly);

        if (uncalculatedLogs.Count == 0)
        {
            throw new AppException($"Không có ca làm việc nào chưa tính lương của nhân viên này trước ngày {upToDateOnly:dd/MM/yyyy}.", 400, "PAYROLL_ERR");
        }

        // Tính tổng lương
        decimal totalReceived = uncalculatedLogs.Sum(l => l.TotalReceived);

        var payrollId = Guid.NewGuid();
        var payroll = new StaffSalaryTotalLoggerEntity
        {
            SalaryTotalLoggerId = payrollId,
            TotalReceived = totalReceived,
            ReceivedDay = DateTime.UtcNow, // Mặc định thời điểm tạo, sẽ cập nhật khi thực trả
            StaffId = dto.StaffId,
            PaidByUserId = null,
            PaymentStatus = "Pending"
        };

        await _repository.AddSalaryTotalLogAsync(payroll);

        // Gắn liên kết bảng lương cho từng ca làm việc
        foreach (var log in uncalculatedLogs)
        {
            log.SalaryTotalLoggerId = payrollId;
        }

        await _unitOfWork.SaveChangesAsync();

        // Map sang DTO kết quả
        var result = new ResPayrollDto
        {
            SalaryTotalLoggerId = payroll.SalaryTotalLoggerId,
            TotalReceived = payroll.TotalReceived,
            ReceivedDay = payroll.ReceivedDay,
            StaffId = payroll.StaffId,
            StaffName = staffProfile.UserInfoEntity.UserName,
            PaidByUserId = null,
            PaidByName = null,
            PaymentStatus = payroll.PaymentStatus,
            WorkingLogs = uncalculatedLogs.Select(l => new ResStaffWorkingLogDto
            {
                StaffWorkingLoggerId = l.StaffWorkingLoggerId,
                SalaryPerHour = l.SalaryPerHour,
                WorkingHour = l.WorkingHour,
                StartedShiftTime = l.StartedShiftTime,
                EndedShiftTime = l.EndedShiftTime,
                WorkingDate = l.WorkingDate,
                TotalReceived = l.TotalReceived
            }).ToList()
        };

        return new BaseResponse<ResPayrollDto>
        {
            IsSuccess = true,
            Data = result,
            Message = $"Tính lương thành công! Tổng số ca làm: {uncalculatedLogs.Count}, tổng số tiền: {totalReceived:N0} VNĐ."
        };
    }

    // 2. Xác nhận đã chi trả lương
    public async Task<BaseResponse<bool>> PayAsync(Guid payrollId, Guid managerUserId)
    {
        var payroll = await _repository.GetSalaryTotalLogByIdAsync(payrollId);

        if (payroll == null)
        {
            throw new AppException("Không tìm thấy bản ghi bảng lương.", 404, "PAYROLL_ERR");
        }

        if (payroll.PaymentStatus == "Paid")
        {
            throw new AppException("Bảng lương này đã được thanh toán từ trước.", 400, "PAYROLL_ERR");
        }

        // Kiểm tra quyền của quản lý rạp
        await VerifyManagerPermissionAsync(managerUserId, payroll.StaffProfileEntity.CinemaId);

        // Cập nhật trạng thái thanh toán
        payroll.PaymentStatus = "Paid";
        payroll.PaidByUserId = managerUserId;
        payroll.ReceivedDay = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync();

        await _sseNotificationService.SendNotificationAsync(
            payroll.StaffId,
            "Thanh toán lương",
            $"Bảng lương trị giá {payroll.TotalReceived:N0} VNĐ của bạn đã được xác nhận thanh toán.",
            "PayrollProcessed"
        );

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = $"Xác nhận thanh toán thành công số tiền {payroll.TotalReceived:N0} VNĐ."
        };
    }

    #region Private Helpers
    private async Task VerifyManagerPermissionAsync(Guid managerUserId, Guid cinemaId)
    {
        // 1. Kiểm tra vai trò Admin
        var isAdmin = await _repository.UserHasRoleAsync(managerUserId, "Admin");

        if (isAdmin) return; // Admin có toàn quyền

        // 2. Kiểm tra vai trò TheaterManager
        var isTheaterManager = await _repository.UserHasRoleAsync(managerUserId, "TheaterManager");

        if (!isTheaterManager)
        {
            throw new AppException("Bạn không có quyền thực hiện thao tác quản lý tiền lương này.", 403, "PAYROLL_ERR");
        }

        // Kiểm tra xem quản lý có thuộc đúng chi nhánh rạp của nhân viên không
        var managerProfile = await _repository.GetStaffProfileAsync(managerUserId);

        if (managerProfile == null || managerProfile.CinemaId != cinemaId)
        {
            throw new AppException("Bạn chỉ được phép quản lý tiền lương tại chi nhánh rạp của mình.", 403, "PAYROLL_ERR");
        }
    }
    #endregion
}
