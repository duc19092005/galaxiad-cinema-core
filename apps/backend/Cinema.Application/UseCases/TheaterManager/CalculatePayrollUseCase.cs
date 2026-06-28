using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager;

public class CalculatePayrollUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IShiftManagerRepository _repository;
    private readonly ISseNotificationService _sseNotificationService;

    public CalculatePayrollUseCase(
        IShiftManagerRepository repository,
        ISseNotificationService sseNotificationService,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _sseNotificationService = sseNotificationService;
    }

    public async Task<BaseResponse<ResPayrollDto>> CalculateAsync(ReqCalculatePayrollDto dto, Guid managerUserId)
    {
        var staffProfile = await _repository.GetStaffProfileWithUserAsync(dto.StaffId);
        if (staffProfile == null)
        {
            throw new AppException(Messages.Staff.StaffProfileNotFound, 404, "PAYROLL_ERR");
        }

        await VerifyManagerPermissionAsync(managerUserId, staffProfile.CinemaId);

        var upToDateOnly = dto.UpToDate.Date;
        var uncalculatedLogs = await _repository.GetUncalculatedWorkingLogsAsync(dto.StaffId, upToDateOnly);

        if (uncalculatedLogs.Count == 0)
        {
            throw new AppException(Messages.Staff.NoUncalculatedShiftsBefore(upToDateOnly), 400, "PAYROLL_ERR");
        }

        var totalReceived = uncalculatedLogs.Sum(log => log.TotalReceived);
        var payrollId = Guid.NewGuid();
        var payroll = new StaffSalaryTotalLoggerEntity
        {
            SalaryTotalLoggerId = payrollId,
            TotalReceived = totalReceived,
            ReceivedDay = DateTime.UtcNow,
            StaffId = dto.StaffId,
            PaidByUserId = null,
            PaymentStatus = "Pending"
        };

        await _repository.AddSalaryTotalLogAsync(payroll);

        foreach (var log in uncalculatedLogs)
        {
            log.SalaryTotalLoggerId = payrollId;
        }

        await _unitOfWork.SaveChangesAsync();

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
            WorkingLogs = uncalculatedLogs.Select(log => new ResStaffWorkingLogDto
            {
                StaffWorkingLoggerId = log.StaffWorkingLoggerId,
                SalaryPerHour = log.SalaryPerHour,
                WorkingHour = log.WorkingHour,
                StartedShiftTime = log.StartedShiftTime,
                EndedShiftTime = log.EndedShiftTime,
                WorkingDate = log.WorkingDate,
                TotalReceived = log.TotalReceived
            }).ToList()
        };

        return new BaseResponse<ResPayrollDto>
        {
            IsSuccess = true,
            Data = result,
            Message = Messages.Staff.PayrollCalculated(uncalculatedLogs.Count, totalReceived)
        };
    }

    public async Task<BaseResponse<bool>> PayAsync(Guid payrollId, Guid managerUserId)
    {
        var payroll = await _repository.GetSalaryTotalLogByIdAsync(payrollId);
        if (payroll == null)
        {
            throw new AppException(Messages.Staff.PayrollNotFound, 404, "PAYROLL_ERR");
        }

        if (payroll.PaymentStatus == "Paid")
        {
            throw new AppException(Messages.Staff.PayrollAlreadyPaid, 400, "PAYROLL_ERR");
        }

        await VerifyManagerPermissionAsync(managerUserId, payroll.StaffProfileEntity.CinemaId);

        payroll.PaymentStatus = "Paid";
        payroll.PaidByUserId = managerUserId;
        payroll.ReceivedDay = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync();

        await _sseNotificationService.SendNotificationAsync(
            payroll.StaffId,
            "Payroll paid",
            $"Your payroll of {payroll.TotalReceived:N0} VND has been confirmed as paid.",
            "PayrollProcessed"
        );

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = Messages.Staff.PayrollPaid(payroll.TotalReceived)
        };
    }

    private async Task VerifyManagerPermissionAsync(Guid managerUserId, Guid cinemaId)
    {
        var isAdmin = await _repository.UserHasRoleAsync(managerUserId, "Admin");
        if (isAdmin)
        {
            return;
        }

        var isTheaterManager = await _repository.UserHasRoleAsync(managerUserId, "TheaterManager");
        if (!isTheaterManager)
        {
            throw new AppException(Messages.Staff.PayrollNoPermission, 403, "PAYROLL_ERR");
        }

        var managerProfile = await _repository.GetStaffProfileAsync(managerUserId);
        if (managerProfile == null || managerProfile.CinemaId != cinemaId)
        {
            throw new AppException(Messages.Staff.PayrollBranchOnly, 403, "PAYROLL_ERR");
        }
    }
}
