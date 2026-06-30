using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager.ShiftManagement;

public class CreateShiftTemplateUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IShiftManagerRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly ILogger<CreateShiftTemplateUseCase> _logger;

    public CreateShiftTemplateUseCase(
        IShiftManagerRepository repository,
        IUserContextService userContextService,
        ILogger<CreateShiftTemplateUseCase> logger,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _userContextService = userContextService;
        _logger = logger;
    }

    private static double GetDurationHours(TimeSpan startTime, TimeSpan endTime)
    {
        var duration = endTime - startTime;
        if (duration.Ticks <= 0)
        {
            duration = duration.Add(TimeSpan.FromDays(1));
        }
        return duration.TotalHours;
    }

    private static TimeSpan NormalizeTimeSpanToUtc(TimeSpan localTime)
    {
        var utcTime = localTime.Subtract(TimeSpan.FromHours(7));
        if (utcTime.Ticks < 0)
        {
            utcTime = utcTime.Add(TimeSpan.FromDays(1));
        }
        return utcTime;
    }

    private static bool IsValidTheaterHour(TimeSpan time)
    {
        return time >= TimeSpan.FromHours(6) || time <= TimeSpan.FromHours(2);
    }

    public async Task<BaseResponse<CinemaShiftTemplateEntity>> ExecuteAsync(ReqCreateShiftTemplateDto dto)
    {
        var managerId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        if (!isAdmin)
        {
            var isManager = await _repository.IsManagerOfCinemaAsync(dto.CinemaId, managerId);
            if (!isManager)
            {
                return new BaseResponse<CinemaShiftTemplateEntity>
                {
                    IsSuccess = false,
                    Message = Messages.Staff.NoPermissionManageWorkSchedule
                };
            }
        }

        if (!IsValidTheaterHour(dto.StartTime) || !IsValidTheaterHour(dto.EndTime))
        {
            throw new AppException(Messages.Staff.CinemaOperatingHours, 400, "SHIFT_ERR");
        }

        var duration = GetDurationHours(dto.StartTime, dto.EndTime);
        if (dto.ShiftType == ShiftType.FullTime && Math.Abs(duration - 8.0) > 0.001)
        {
            throw new AppException(Messages.Staff.FullTimeShiftMustBeEightHours, 400, "SHIFT_ERR");
        }
        if (dto.ShiftType == ShiftType.PartTime && Math.Abs(duration - 4.0) > 0.001)
        {
            throw new AppException(Messages.Staff.PartTimeShiftMustBeFourHours, 400, "SHIFT_ERR");
        }

        var newTemplate = new CinemaShiftTemplateEntity
        {
            ShiftTemplateId = Guid.NewGuid(),
            CinemaId = dto.CinemaId,
            ShiftName = dto.ShiftName,
            StartTime = NormalizeTimeSpanToUtc(dto.StartTime),
            EndTime = NormalizeTimeSpanToUtc(dto.EndTime),
            MaxStaff = dto.MaxStaff,
            RoleId = dto.RoleId,
            ShiftType = dto.ShiftType,
            IsActive = true
        };

        await _repository.AddShiftTemplateAsync(newTemplate);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Created shift template {ShiftTemplateId} for cinema {CinemaId}.", newTemplate.ShiftTemplateId, dto.CinemaId);

        return new BaseResponse<CinemaShiftTemplateEntity>
        {
            IsSuccess = true,
            Data = newTemplate,
            Message = Messages.Staff.ShiftTemplateCreated
        };
    }
}
