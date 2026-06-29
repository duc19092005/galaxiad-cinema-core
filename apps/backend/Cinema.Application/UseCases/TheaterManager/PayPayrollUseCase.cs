using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager;

public class PayPayrollUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IShiftManagerRepository _repository;
    private readonly ISseNotificationService _sseNotificationService;

    public PayPayrollUseCase(
        IShiftManagerRepository repository,
        ISseNotificationService sseNotificationService,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _sseNotificationService = sseNotificationService;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid payrollId, Guid managerUserId)
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
