using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.TheaterManager;

/// <summary>
/// Creates a new shift template for a cinema.
/// </summary>
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

/// <summary>
/// Gets the list of shift templates for a cinema.
/// </summary>
public class GetShiftTemplatesUseCase
{
    private readonly IShiftManagerRepository _repository;

    public GetShiftTemplatesUseCase(IShiftManagerRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<ResShiftTemplateDto>>> ExecuteAsync(Guid cinemaId)
    {
        var templates = await _repository.GetShiftTemplatesAsync(cinemaId);
        return new BaseResponse<List<ResShiftTemplateDto>> { IsSuccess = true, Data = templates };
    }
}

/// <summary>
/// Gets shift registrations for a cinema with optional status filter.
/// </summary>
public class GetShiftRegistrationsUseCase
{
    private readonly IShiftManagerRepository _repository;
    private readonly IUserContextService _userContextService;

    public GetShiftRegistrationsUseCase(
        IShiftManagerRepository repository,
        IUserContextService userContextService)
    {
        _repository = repository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<List<ResStaffShiftRegistrationDto>>> ExecuteAsync(Guid cinemaId, string? status)
    {
        var managerId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        if (!isAdmin)
        {
            var isManager = await _repository.IsManagerOfCinemaAsync(cinemaId, managerId);
            if (!isManager)
            {
                return new BaseResponse<List<ResStaffShiftRegistrationDto>>
                {
                    IsSuccess = false,
                    Message = Messages.Staff.NoPermissionViewBranchStaff
                };
            }
        }

        var list = await _repository.GetShiftRegistrationsAsync(cinemaId, status);
        return new BaseResponse<List<ResStaffShiftRegistrationDto>> { IsSuccess = true, Data = list };
    }
}

/// <summary>
/// Gets staff profiles for a cinema.
/// </summary>
public class GetStaffProfilesUseCase
{
    private readonly IShiftManagerRepository _repository;
    private readonly IUserContextService _userContextService;

    public GetStaffProfilesUseCase(
        IShiftManagerRepository repository,
        IUserContextService userContextService)
    {
        _repository = repository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<List<ResStaffProfileDto>>> ExecuteAsync(Guid cinemaId)
    {
        var managerId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        if (!isAdmin)
        {
            var isManager = await _repository.IsManagerOfCinemaAsync(cinemaId, managerId);
            if (!isManager)
            {
                return new BaseResponse<List<ResStaffProfileDto>>
                {
                    IsSuccess = false,
                    Message = Messages.Staff.NoPermissionManageBranchStaff
                };
            }
        }

        var list = await _repository.GetStaffProfilesAsync(cinemaId);
        return new BaseResponse<List<ResStaffProfileDto>> { IsSuccess = true, Data = list };
    }
}

/// <summary>
/// Updates a staff profile.
/// </summary>
public class UpdateStaffProfileUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IShiftManagerRepository _repository;
    private readonly IUserContextService _userContextService;

    public UpdateStaffProfileUseCase(
        IShiftManagerRepository repository,
        IUserContextService userContextService,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid staffUserId, ReqUpdateStaffProfileDto dto)
    {
        var managerId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var staff = await _repository.GetStaffProfileAsync(staffUserId);
        if (staff == null)
        {
            return new BaseResponse<bool> { IsSuccess = false, Message = Messages.Staff.StaffNotFound };
        }

        if (!isAdmin)
        {
            var isManager = await _repository.IsManagerOfCinemaAsync(staff.CinemaId, managerId);
            if (!isManager)
            {
                return new BaseResponse<bool>
                {
                    IsSuccess = false,
                    Message = Messages.Staff.NoPermissionUpdateBranchStaff
                };
            }
        }

        await _repository.UpdateStaffProfileAsync(staff, dto);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = Messages.Staff.StaffProfileUpdated
        };
    }
}

/// <summary>
/// Gets payroll history for a specific staff member.
/// </summary>
public class GetStaffPayrollUseCase
{
    private readonly IShiftManagerRepository _repository;
    private readonly IUserContextService _userContextService;

    public GetStaffPayrollUseCase(
        IShiftManagerRepository repository,
        IUserContextService userContextService)
    {
        _repository = repository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<List<ResPayrollDto>>> ExecuteAsync(Guid staffId)
    {
        var managerId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var staffProfile = await _repository.GetStaffProfileAsync(staffId);
        if (staffProfile == null)
        {
            return new BaseResponse<List<ResPayrollDto>> { IsSuccess = false, Message = Messages.Staff.StaffNotFound };
        }

        if (!isAdmin)
        {
            var isManager = await _repository.IsManagerOfCinemaAsync(staffProfile.CinemaId, managerId);
            if (!isManager)
            {
                return new BaseResponse<List<ResPayrollDto>>
                {
                    IsSuccess = false,
                    Message = Messages.Staff.NoPermissionViewBranchPayroll
                };
            }
        }

        var list = await _repository.GetStaffPayrollAsync(staffId);
        return new BaseResponse<List<ResPayrollDto>> { IsSuccess = true, Data = list };
    }
}

/// <summary>
/// Gets payroll history for all staff in a cinema.
/// </summary>
public class GetCinemaPayrollUseCase
{
    private readonly IShiftManagerRepository _repository;
    private readonly IUserContextService _userContextService;

    public GetCinemaPayrollUseCase(
        IShiftManagerRepository repository,
        IUserContextService userContextService)
    {
        _repository = repository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<List<ResPayrollDto>>> ExecuteAsync(Guid cinemaId)
    {
        var managerId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        if (!isAdmin)
        {
            var isManager = await _repository.IsManagerOfCinemaAsync(cinemaId, managerId);
            if (!isManager)
            {
                return new BaseResponse<List<ResPayrollDto>>
                {
                    IsSuccess = false,
                    Message = Messages.Staff.NoPermissionViewBranchPayroll
                };
            }
        }

        var list = await _repository.GetCinemaPayrollAsync(cinemaId);
        return new BaseResponse<List<ResPayrollDto>> { IsSuccess = true, Data = list };
    }
}
