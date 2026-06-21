using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

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
                    Message = "Báº¡n khÃ´ng cÃ³ quyá»n quáº£n lÃ½ ca trá»±c cho ráº¡p nÃ y."
                };
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

        await _repository.AddShiftTemplateAsync(newTemplate);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<CinemaShiftTemplateEntity>
        {
            IsSuccess = true,
            Data = newTemplate,
            Message = "Táº¡o ca trá»±c máº«u thÃ nh cÃ´ng."
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
                    Message = "Báº¡n khÃ´ng cÃ³ quyá»n xem thÃ´ng tin nhÃ¢n sá»± táº¡i chi nhÃ¡nh ráº¡p nÃ y."
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
                    Message = "Báº¡n khÃ´ng cÃ³ quyá»n quáº£n lÃ½ nhÃ¢n sá»± táº¡i chi nhÃ¡nh ráº¡p nÃ y."
                };
            }
        }

        var list = await _repository.GetStaffProfilesAsync(cinemaId);
        return new BaseResponse<List<ResStaffProfileDto>> { IsSuccess = true, Data = list };
    }
}

/// <summary>
/// Updates a staff profile (working status, cinema assignment, manager flag).
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
            return new BaseResponse<bool> { IsSuccess = false, Message = "KhÃ´ng tÃ¬m tháº¥y nhÃ¢n viÃªn." };
        }

        if (!isAdmin)
        {
            var isManager = await _repository.IsManagerOfCinemaAsync(staff.CinemaId, managerId);
            if (!isManager)
            {
                return new BaseResponse<bool>
                {
                    IsSuccess = false,
                    Message = "Báº¡n chá»‰ cÃ³ quyá»n cáº­p nháº­t nhÃ¢n sá»± thuá»™c chi nhÃ¡nh ráº¡p cá»§a mÃ¬nh."
                };
            }
        }

        await _repository.UpdateStaffProfileAsync(staff, dto);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = "Cáº­p nháº­t thÃ´ng tin nhÃ¢n viÃªn thÃ nh cÃ´ng."
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
            return new BaseResponse<List<ResPayrollDto>> { IsSuccess = false, Message = "KhÃ´ng tÃ¬m tháº¥y nhÃ¢n viÃªn." };
        }

        if (!isAdmin)
        {
            var isManager = await _repository.IsManagerOfCinemaAsync(staffProfile.CinemaId, managerId);
            if (!isManager)
            {
                return new BaseResponse<List<ResPayrollDto>>
                {
                    IsSuccess = false,
                    Message = "Báº¡n chá»‰ cÃ³ quyá»n xem thÃ´ng tin tiá»n lÆ°Æ¡ng cá»§a nhÃ¢n sá»± thuá»™c chi nhÃ¡nh ráº¡p cá»§a mÃ¬nh."
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
                    Message = "Báº¡n chá»‰ cÃ³ quyá»n xem thÃ´ng tin tiá»n lÆ°Æ¡ng cá»§a nhÃ¢n sá»± thuá»™c chi nhÃ¡nh ráº¡p cá»§a mÃ¬nh."
                };
            }
        }

        var list = await _repository.GetCinemaPayrollAsync(cinemaId);
        return new BaseResponse<List<ResPayrollDto>> { IsSuccess = true, Data = list };
    }
}

