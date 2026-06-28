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
            throw new AppException("Department not found.", 404, "DEPT_ERR");

        if (!isAdmin && department.CinemaInfoEntity.FacilitiesManagerId != userId)
            throw new AppException("You do not have permission to modify this department.", 403, "DEPT_ERR");

        // 1. Check uniqueness of the name if renaming or reactivating the department
        bool nameChanging = request.DepartmentName != null && request.DepartmentName != department.DepartmentName;
        bool activating = request.IsActive == true && !department.IsActive;

        if (nameChanging || activating)
        {
            string targetName = request.DepartmentName ?? department.DepartmentName;
            var exists = await _departmentRepository.DepartmentExistsExcludeAsync(department.CinemaId, targetName, departmentId);
            if (exists)
                throw new AppException($"Department '{targetName}' already exists in this cinema.", 400, "DEPT_ERR");
        }

        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            if (request.DepartmentName != null)
                department.DepartmentName = request.DepartmentName;

            if (request.IsActive.HasValue)
            {
                department.IsActive = request.IsActive.Value;
                
                // Đồng bộ hóa trạng thái tài khoản dùng chung
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
                Message = "Department updated successfully."
            };
        }
        catch (AppException) { await transaction.RollbackAsync(); throw; }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            throw new AppException($"Error updating department: {ex.Message}", 500, "DEPT_ERR");
        }
    }
}

