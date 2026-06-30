using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager.ShiftManagement;

public class ShiftRegistrationResolver
{
    private readonly IShiftManagerRepository _repository;

    public ShiftRegistrationResolver(IShiftManagerRepository repository)
    {
        _repository = repository;
    }

    public async Task<(Guid CinemaId, string ShiftName, int MaxStaff)> ResolveCinemaAndShiftAsync(
        StaffShiftRegistrationEntity registration)
    {
        if (registration.ShiftScheduleId.HasValue && registration.CinemaShiftScheduleEntity != null)
        {
            return (
                registration.CinemaShiftScheduleEntity.CinemaId,
                registration.CinemaShiftScheduleEntity.ShiftName,
                registration.CinemaShiftScheduleEntity.MaxStaff
            );
        }

        if (registration.CinemaShiftTemplateEntity != null)
        {
            return (
                registration.CinemaShiftTemplateEntity.CinemaId,
                registration.CinemaShiftTemplateEntity.ShiftName,
                registration.CinemaShiftTemplateEntity.MaxStaff
            );
        }

        throw new AppException(Messages.Staff.InvalidShiftRegistrationStatus, 400, "SHIFT_ERR");
    }

    public async Task VerifyManagerPermissionAsync(Guid managerUserId, Guid cinemaId)
    {
        var isAdmin = await _repository.UserHasRoleAsync(managerUserId, "Admin");
        if (isAdmin) return;

        var isTheaterManager = await _repository.UserHasRoleAsync(managerUserId, "TheaterManager");
        if (!isTheaterManager)
        {
            throw new AppException(Messages.Staff.NoPermissionShiftManage, 403, "SHIFT_ERR");
        }

        var managerProfile = await _repository.GetStaffProfileAsync(managerUserId);
        if (managerProfile == null || managerProfile.CinemaId != cinemaId)
        {
            throw new AppException(Messages.Staff.NoPermissionBranchStaffOnly, 403, "SHIFT_ERR");
        }
    }
}
