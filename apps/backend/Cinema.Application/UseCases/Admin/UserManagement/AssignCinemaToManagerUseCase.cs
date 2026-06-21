using System;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Admin;
using Cinema.Application.Interfaces;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Admin.UserManagement;

public class AssignCinemaToManagerUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAdminUserRepository _adminUserRepository;
    private readonly IAuditLogService _auditLogService;

    public AssignCinemaToManagerUseCase(
        IUnitOfWork unitOfWork,
        IAdminUserRepository adminUserRepository,
        IAuditLogService auditLogService)
    {
        _unitOfWork = unitOfWork;
        _adminUserRepository = adminUserRepository;
        _auditLogService = auditLogService;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(Guid cinemaId, Guid managerId)
    {
        var cinema = await _adminUserRepository.FindActiveCinemaAsync(cinemaId);
        if (cinema == null) return new BaseResponse<string> { IsSuccess = false, Message = Messages.Admin.CinemaNotFound };

        var userRoleNames = await _adminUserRepository.GetUserRolesAsync(managerId);

        var isManager = userRoleNames.Contains("TheaterManager") || userRoleNames.Contains("FacilitiesManager");
        var isStaff = userRoleNames.Any(name => name == "Cashier" || name == "MovieManager" || name == "TheaterManager" || name == "FacilitiesManager");

        if (!isManager && !isStaff)
        {
            return new BaseResponse<string> { IsSuccess = false, Message = Messages.Admin.UserMustBeStaff };
        }

        if (isManager)
        {
            var isTheaterManager = userRoleNames.Contains("TheaterManager");
            if (isTheaterManager)
            {
                cinema.TheaterManagerId = managerId;
            }
            else
            {
                cinema.FacilitiesManagerId = managerId;
            }
            _unitOfWork.Repository<CinemaInfoEntity>().Update(cinema);
        }

        if (isStaff || isManager)
        {
            var staffProfile = await _adminUserRepository.FindStaffProfileAsync(managerId);
            if (staffProfile != null)
            {
                staffProfile.CinemaId = cinemaId;
                staffProfile.IsCinemaManager = userRoleNames.Contains("TheaterManager");
                _unitOfWork.Repository<StaffProfileEntity>().Update(staffProfile);
            }
            else
            {
                await _unitOfWork.Repository<StaffProfileEntity>().AddAsync(new StaffProfileEntity
                {
                    UserId = managerId,
                    WorkingStatus = true,
                    CinemaId = cinemaId,
                    IsCinemaManager = userRoleNames.Contains("TheaterManager")
                });
            }
        }

        await _auditLogService.WriteAsync(
            "Update",
            "Cinema",
            cinema.CinemaId,
            cinema.CinemaName,
            $"Assigned user to cinema {cinema.CinemaName}.",
            cinema.CinemaId);
            
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<string> { IsSuccess = true, Message = Messages.Admin.AssignedCinemaSuccess };
    }
}

