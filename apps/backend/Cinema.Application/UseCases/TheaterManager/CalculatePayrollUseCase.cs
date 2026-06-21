using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Exceptions;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

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

    // 1. TÃ­nh toÃ¡n lÆ°Æ¡ng tÃ­ch lÅ©y vÃ  táº¡o báº£n ghi báº£ng lÆ°Æ¡ng (Pending)
    public async Task<BaseResponse<ResPayrollDto>> CalculateAsync(ReqCalculatePayrollDto dto, Guid managerUserId)
    {
        var staffProfile = await _repository.GetStaffProfileWithUserAsync(dto.StaffId);

        if (staffProfile == null)
        {
            throw new AppException("TÃ i khoáº£n nhÃ¢n viÃªn khÃ´ng tá»“n táº¡i hoáº·c Ä‘Ã£ ngá»«ng hoáº¡t Ä‘á»™ng.", 404, "PAYROLL_ERR");
        }

        // Kiá»ƒm tra quyá»n cá»§a quáº£n lÃ½ Ä‘á»‘i vá»›i chi nhÃ¡nh ráº¡p cá»§a nhÃ¢n viÃªn
        await VerifyManagerPermissionAsync(managerUserId, staffProfile.CinemaId);

        var upToDateOnly = dto.UpToDate.Date;

        // Láº¥y táº¥t cáº£ cÃ¡c ca lÃ m viá»‡c Ä‘Ã£ hoÃ n thÃ nh (EndedShiftTime != null) cá»§a nhÃ¢n viÃªn nÃ y 
        // trÆ°á»›c hoáº·c báº±ng ngÃ y chá»‰ Ä‘á»‹nh vÃ  chÆ°a Ä‘Æ°á»£c tÃ­nh lÆ°Æ¡ng (SalaryTotalLoggerId == null)
        var uncalculatedLogs = await _repository.GetUncalculatedWorkingLogsAsync(dto.StaffId, upToDateOnly);

        if (uncalculatedLogs.Count == 0)
        {
            throw new AppException($"KhÃ´ng cÃ³ ca lÃ m viá»‡c nÃ o chÆ°a tÃ­nh lÆ°Æ¡ng cá»§a nhÃ¢n viÃªn nÃ y trÆ°á»›c ngÃ y {upToDateOnly:dd/MM/yyyy}.", 400, "PAYROLL_ERR");
        }

        // TÃ­nh tá»•ng lÆ°Æ¡ng
        decimal totalReceived = uncalculatedLogs.Sum(l => l.TotalReceived);

        var payrollId = Guid.NewGuid();
        var payroll = new StaffSalaryTotalLoggerEntity
        {
            SalaryTotalLoggerId = payrollId,
            TotalReceived = totalReceived,
            ReceivedDay = DateTime.UtcNow, // Máº·c Ä‘á»‹nh thá»i Ä‘iá»ƒm táº¡o, sáº½ cáº­p nháº­t khi thá»±c tráº£
            StaffId = dto.StaffId,
            PaidByUserId = null,
            PaymentStatus = "Pending"
        };

        await _repository.AddSalaryTotalLogAsync(payroll);

        // Gáº¯n liÃªn káº¿t báº£ng lÆ°Æ¡ng cho tá»«ng ca lÃ m viá»‡c
        foreach (var log in uncalculatedLogs)
        {
            log.SalaryTotalLoggerId = payrollId;
        }

        await _unitOfWork.SaveChangesAsync();

        // Map sang DTO káº¿t quáº£
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
            Message = $"TÃ­nh lÆ°Æ¡ng thÃ nh cÃ´ng! Tá»•ng sá»‘ ca lÃ m: {uncalculatedLogs.Count}, tá»•ng sá»‘ tiá»n: {totalReceived:N0} VNÄ."
        };
    }

    // 2. XÃ¡c nháº­n Ä‘Ã£ chi tráº£ lÆ°Æ¡ng
    public async Task<BaseResponse<bool>> PayAsync(Guid payrollId, Guid managerUserId)
    {
        var payroll = await _repository.GetSalaryTotalLogByIdAsync(payrollId);

        if (payroll == null)
        {
            throw new AppException("KhÃ´ng tÃ¬m tháº¥y báº£n ghi báº£ng lÆ°Æ¡ng.", 404, "PAYROLL_ERR");
        }

        if (payroll.PaymentStatus == "Paid")
        {
            throw new AppException("Báº£ng lÆ°Æ¡ng nÃ y Ä‘Ã£ Ä‘Æ°á»£c thanh toÃ¡n tá»« trÆ°á»›c.", 400, "PAYROLL_ERR");
        }

        // Kiá»ƒm tra quyá»n cá»§a quáº£n lÃ½ ráº¡p
        await VerifyManagerPermissionAsync(managerUserId, payroll.StaffProfileEntity.CinemaId);

        // Cáº­p nháº­t tráº¡ng thÃ¡i thanh toÃ¡n
        payroll.PaymentStatus = "Paid";
        payroll.PaidByUserId = managerUserId;
        payroll.ReceivedDay = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync();

        await _sseNotificationService.SendNotificationAsync(
            payroll.StaffId,
            "Thanh toÃ¡n lÆ°Æ¡ng",
            $"Báº£ng lÆ°Æ¡ng trá»‹ giÃ¡ {payroll.TotalReceived:N0} VNÄ cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c xÃ¡c nháº­n thanh toÃ¡n.",
            "PayrollProcessed"
        );

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = $"XÃ¡c nháº­n thanh toÃ¡n thÃ nh cÃ´ng sá»‘ tiá»n {payroll.TotalReceived:N0} VNÄ."
        };
    }

    #region Private Helpers
    private async Task VerifyManagerPermissionAsync(Guid managerUserId, Guid cinemaId)
    {
        // 1. Kiá»ƒm tra vai trÃ² Admin
        var isAdmin = await _repository.UserHasRoleAsync(managerUserId, "Admin");

        if (isAdmin) return; // Admin cÃ³ toÃ n quyá»n

        // 2. Kiá»ƒm tra vai trÃ² TheaterManager
        var isTheaterManager = await _repository.UserHasRoleAsync(managerUserId, "TheaterManager");

        if (!isTheaterManager)
        {
            throw new AppException("Báº¡n khÃ´ng cÃ³ quyá»n thá»±c hiá»‡n thao tÃ¡c quáº£n lÃ½ tiá»n lÆ°Æ¡ng nÃ y.", 403, "PAYROLL_ERR");
        }

        // Kiá»ƒm tra xem quáº£n lÃ½ cÃ³ thuá»™c Ä‘Ãºng chi nhÃ¡nh ráº¡p cá»§a nhÃ¢n viÃªn khÃ´ng
        var managerProfile = await _repository.GetStaffProfileAsync(managerUserId);

        if (managerProfile == null || managerProfile.CinemaId != cinemaId)
        {
            throw new AppException("Báº¡n chá»‰ Ä‘Æ°á»£c phÃ©p quáº£n lÃ½ tiá»n lÆ°Æ¡ng táº¡i chi nhÃ¡nh ráº¡p cá»§a mÃ¬nh.", 403, "PAYROLL_ERR");
        }
    }
    #endregion
}

