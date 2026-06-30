using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager.ShiftManagement;

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
