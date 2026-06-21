using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces;
using Cinema.Domain.Enums;
using Cinema.Application.Exceptions;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.FacilitiesManager.Cinemas;

public class DeleteDepartmentUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDepartmentRepository _departmentRepository;
    private readonly IUserContextService _userContext;

    public DeleteDepartmentUseCase(
        IUnitOfWork unitOfWork,
        IDepartmentRepository departmentRepository,
        IUserContextService userContext)
    {
        _unitOfWork = unitOfWork;
        _departmentRepository = departmentRepository;
        _userContext = userContext;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid departmentId)
    {
        var userId = _userContext.GetUserId();
        var isAdmin = _userContext.IsInRole("Admin");

        var department = await _departmentRepository.FindDepartmentWithCinemaAndUserAsync(departmentId);
        if (department == null)
            throw new AppException("Không tìm thấy phòng ban.", 404, "DEPT_ERR");

        if (!isAdmin && department.CinemaInfoEntity.FacilitiesManagerId != userId)
            throw new AppException("Bạn không có quyền xoá phòng ban này.", 403, "DEPT_ERR");

        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            department.IsActive = false;

            // Đồng bộ khóa tài khoản dùng chung
            if (department.SharedUserInfoEntity != null)
            {
                department.SharedUserInfoEntity.AccountStatus = AccountStatusEnum.Banned;
                _unitOfWork.Repository<UserInfoEntity>().Update(department.SharedUserInfoEntity);

                if (department.SharedUserInfoEntity.StaffProfileEntity != null)
                {
                    department.SharedUserInfoEntity.StaffProfileEntity.WorkingStatus = false;
                    _unitOfWork.Repository<StaffProfileEntity>().Update(department.SharedUserInfoEntity.StaffProfileEntity);
                }
            }

            _unitOfWork.Repository<DepartmentEntity>().Update(department);
            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            return new BaseResponse<bool>
            {
                IsSuccess = true,
                Data = true,
                Message = "Đã vô hiệu hoá phòng ban."
            };
        }
        catch (AppException) { await transaction.RollbackAsync(); throw; }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            throw new AppException($"Lỗi khi xoá phòng ban: {ex.Message}", 500, "DEPT_ERR");
        }
    }
}
