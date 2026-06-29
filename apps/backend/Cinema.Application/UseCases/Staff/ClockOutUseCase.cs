using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces.Staff;
using Cinema.Application.Exceptions;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Staff;

public class ClockOutUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStaffRepository _repository;
    private readonly IConfiguration _configuration;

    public ClockOutUseCase(IStaffRepository repository, IConfiguration configuration,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _configuration = configuration;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid staffId, ReqClockOutDto dto)
    {
        // 1. Tìm bản ghi điểm danh vào ca trực đang hoạt động của nhân viên này
        var activeLog = await _repository.GetActiveWorkingLogAsync(staffId);

        if (activeLog == null)
        {
            throw new AppException(Messages.Staff.NoActiveShiftToClockOut, 400, "CLOCK_OUT_ERR");
        }

        // 2. Xác định thời gian Clock-Out
        var env = _configuration["ASPNETCORE_ENVIRONMENT"] ?? "Production";
        DateTime clockOutTime;

        if (dto.SimulatedDateTime.HasValue && (env.Equals("Development", StringComparison.OrdinalIgnoreCase) || env.Equals("Docker", StringComparison.OrdinalIgnoreCase)))
        {
            clockOutTime = dto.SimulatedDateTime.Value;
        }
        else
        {
            clockOutTime = DateTime.UtcNow;
        }

        // 3. Tính toán số giờ làm việc thực tế
        var duration = clockOutTime - activeLog.StartedShiftTime;
        var workingHours = (decimal)duration.TotalHours;
        if (workingHours < 0)
        {
            workingHours = 0;
        }

        // Tránh sai số quá nhỏ hoặc làm tròn
        activeLog.EndedShiftTime = clockOutTime;
        activeLog.WorkingHour = Math.Round(workingHours, 2);
        activeLog.TotalReceived = Math.Round(activeLog.WorkingHour * activeLog.SalaryPerHour, 2);

        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = string.Format(Messages.Staff.ClockOutSuccess, activeLog.WorkingHour, activeLog.TotalReceived)
        };
    }
}
