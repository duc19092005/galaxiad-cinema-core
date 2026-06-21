using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.FacilitiesManager.Cinemas.Requests;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces;
using Cinema.Domain.Enums;
using Cinema.Application.Exceptions;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.FacilitiesManager.Cinemas;

public class UpdateDepartmentUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDepartmentRepository _departmentRepository;
    private readonly IUserContextService _userContext;

    public UpdateDepartmentUseCase(
        IUnitOfWork unitOfWork,
        IDepartmentRepository departmentRepository,
        IUserContextService userContext)
    {
        _unitOfWork = unitOfWork;
        _departmentRepository = departmentRepository;
        _userContext = userContext;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid departmentId, UpdateDepartmentReqDto request)
    {
        var userId = _userContext.GetUserId();
        var isAdmin = _userContext.IsInRole("Admin");

        var department = await _departmentRepository.FindDepartmentWithCinemaAndUserAsync(departmentId);
        if (department == null)
            throw new AppException("KhÃ´ng tÃ¬m tháº¥y phÃ²ng ban.", 404, "DEPT_ERR");

        if (!isAdmin && department.CinemaInfoEntity.FacilitiesManagerId != userId)
            throw new AppException("Báº¡n khÃ´ng cÃ³ quyá»n sá»­a phÃ²ng ban nÃ y.", 403, "DEPT_ERR");

        // 1. Kiá»ƒm tra tÃ­nh duy nháº¥t cá»§a tÃªn náº¿u Ä‘á»•i tÃªn hoáº·c kÃ­ch hoáº¡t láº¡i phÃ²ng ban
        bool nameChanging = request.DepartmentName != null && request.DepartmentName != department.DepartmentName;
        bool activating = request.IsActive == true && !department.IsActive;

        if (nameChanging || activating)
        {
            string targetName = request.DepartmentName ?? department.DepartmentName;
            var exists = await _departmentRepository.DepartmentExistsExcludeAsync(department.CinemaId, targetName, departmentId);
            if (exists)
                throw new AppException($"PhÃ²ng ban '{targetName}' Ä‘Ã£ tá»“n táº¡i trong ráº¡p nÃ y.", 400, "DEPT_ERR");
        }

        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            if (request.DepartmentName != null)
                department.DepartmentName = request.DepartmentName;

            if (request.IsActive.HasValue)
            {
                department.IsActive = request.IsActive.Value;
                
                // Äá»“ng bá»™ hÃ³a tráº¡ng thÃ¡i tÃ i khoáº£n dÃ¹ng chung
                if (department.SharedUserInfoEntity != null)
                {
                    department.SharedUserInfoEntity.AccountStatus = request.IsActive.Value 
                        ? AccountStatusEnum.Active 
                        : AccountStatusEnum.Banned;
                    _unitOfWork.Repository<UserInfoEntity>().Update(department.SharedUserInfoEntity);

                    if (department.SharedUserInfoEntity.StaffProfileEntity != null)
                    {
                        department.SharedUserInfoEntity.StaffProfileEntity.WorkingStatus = request.IsActive.Value;
                        _unitOfWork.Repository<StaffProfileEntity>().Update(department.SharedUserInfoEntity.StaffProfileEntity);
                    }
                }
            }

            _unitOfWork.Repository<DepartmentEntity>().Update(department);
            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            return new BaseResponse<bool>
            {
                IsSuccess = true,
                Data = true,
                Message = "Cáº­p nháº­t phÃ²ng ban thÃ nh cÃ´ng."
            };
        }
        catch (AppException) { await transaction.RollbackAsync(); throw; }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            throw new AppException($"Lá»—i khi cáº­p nháº­t phÃ²ng ban: {ex.Message}", 500, "DEPT_ERR");
        }
    }
}

