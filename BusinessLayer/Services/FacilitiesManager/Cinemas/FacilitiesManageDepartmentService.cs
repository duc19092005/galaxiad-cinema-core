using BusinessLayer.Constants;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.FacilitiesManager.Cinemas.Requests;
using BusinessLayer.Entities.CinemaInfos;
using BusinessLayer.Entities.UserInfos;
using BusinessLayer.Services.IdentityAccess;
using Microsoft.EntityFrameworkCore;
using Shared.Enums;
using Shared.Exceptions;
using Shared.Interfaces.Persistence;
using Shared.Utils;

namespace BusinessLayer.Services.FacilitiesManager.Cinemas;

/// <summary>
/// Service quản lý phòng ban thu ngân (Cashier Department).
/// Khi tạo phòng ban mới → tự động tạo tài khoản dùng chung cho quầy.
/// </summary>
public class FacilitiesManageDepartmentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserContextService _userContext;

    public FacilitiesManageDepartmentService(
        IUnitOfWork unitOfWork,
        IUserContextService userContext)
    {
        _unitOfWork = unitOfWork;
        _userContext = userContext;
    }

    /// <summary>Lấy danh sách phòng ban của một rạp</summary>
    public async Task<BaseResponse<List<ResDepartmentDto>>> GetDepartmentsAsync(Guid cinemaId)
    {
        var userId = _userContext.GetUserId();
        var isAdmin = _userContext.IsInRole("Admin");

        // Verify access
        if (!isAdmin)
        {
            var hasAccess = await _unitOfWork.Repository<CinemaInfoEntity>().Query()
                .AnyAsync(c => c.CinemaId == cinemaId &&
                               (c.FacilitiesManagerId == userId || c.TheaterManagerId == userId));
            if (!hasAccess)
                return new BaseResponse<List<ResDepartmentDto>>
                {
                    IsSuccess = false,
                    Message = "Bạn không có quyền quản lý rạp này."
                };
        }

        var departments = await _unitOfWork.Repository<DepartmentEntity>().Query()
            .Include(d => d.CinemaInfoEntity)
            .Include(d => d.SharedUserInfoEntity)
            .Where(d => d.CinemaId == cinemaId)
            .Select(d => new ResDepartmentDto
            {
                DepartmentId = d.DepartmentId,
                CinemaId = d.CinemaId,
                CinemaName = d.CinemaInfoEntity.CinemaName,
                DepartmentName = d.DepartmentName,
                DepartmentType = d.DepartmentType.ToString(),
                CashierType = d.CashierType.ToString(),
                SharedUserId = d.SharedUserId,
                SharedUserEmail = d.SharedUserInfoEntity != null ? d.SharedUserInfoEntity.UserEmail : null,
                IsActive = d.IsActive
            })
            .ToListAsync();

        return new BaseResponse<List<ResDepartmentDto>>
        {
            IsSuccess = true,
            Data = departments
        };
    }

    /// <summary>Tạo phòng ban mới → Tự động tạo tài khoản thu ngân chung cho quầy</summary>
    public async Task<BaseResponse<Guid>> CreateDepartmentAsync(CreateDepartmentReqDto request)
    {
        var userId = _userContext.GetUserId();
        var isAdmin = _userContext.IsInRole("Admin");

        // Validate cinema
        var cinema = await _unitOfWork.Repository<CinemaInfoEntity>().Query()
            .FirstOrDefaultAsync(c => c.CinemaId == request.CinemaId && !c.IsDeleted);

        if (cinema == null)
            throw new AppException("Không tìm thấy rạp phim.", 404, "DEPT_ERR");

        // Check permission
        if (!isAdmin && cinema.FacilitiesManagerId != userId)
            throw new AppException("Bạn không có quyền tạo phòng ban cho rạp này.", 403, "DEPT_ERR");

        // Check unique name per cinema
        var exists = await _unitOfWork.Repository<DepartmentEntity>().Query()
            .AnyAsync(d => d.CinemaId == request.CinemaId && d.DepartmentName == request.DepartmentName && d.IsActive);
        if (exists)
            throw new AppException($"Phòng ban '{request.DepartmentName}' đã tồn tại trong rạp này.", 400, "DEPT_ERR");

        var departmentId = Guid.NewGuid();
        var sharedUserId = Guid.NewGuid();
        var email = $"{request.CashierType.ToString().ToLower()}_{departmentId:N}@cinema.com";
        const string defaultPassword = "123456";

        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            // 1. Create shared user account
            var sharedUser = new UserInfoEntity
            {
                UserId = sharedUserId,
                UserEmail = email,
                Password = BCrypt_helper.Hash(defaultPassword),
                RegisterMethod = RegisterMethodEnum.UsernamePassword,
                AccountStatus = AccountStatusEnum.Active,
                DateOfBirth = new DateTime(2000, 1, 1),
                IdentityCode = $"DEPT_{departmentId:N}",
                PhoneNumber = cinema.CinemaHotLineNumber,
                UserName = $"{request.DepartmentName} - {cinema.CinemaName}"
            };
            await _unitOfWork.Repository<UserInfoEntity>().AddAsync(sharedUser);

            // 2. Assign Cashier role
            await _unitOfWork.Repository<UserRoleInfoEntity>().AddAsync(new UserRoleInfoEntity
            {
                UserId = sharedUserId,
                RoleId = userRoles.Cashier
            });

            // 3. Create StaffProfile for the shared account
            await _unitOfWork.Repository<StaffProfileEntity>().AddAsync(new StaffProfileEntity
            {
                UserId = sharedUserId,
                CinemaId = request.CinemaId,
                DepartmentId = departmentId,
                WorkingStatus = true,
                IsCinemaManager = false
            });

            // 4. Create Department
            await _unitOfWork.Repository<DepartmentEntity>().AddAsync(new DepartmentEntity
            {
                DepartmentId = departmentId,
                CinemaId = request.CinemaId,
                DepartmentName = request.DepartmentName,
                DepartmentType = request.DepartmentType,
                CashierType = request.CashierType,
                SharedUserId = sharedUserId,
                IsActive = true
            });

            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            return new BaseResponse<Guid>
            {
                IsSuccess = true,
                Data = departmentId,
                Message = $"Tạo phòng ban '{request.DepartmentName}' thành công. Tài khoản quầy: {email} / Mật khẩu: {defaultPassword}"
            };
        }
        catch (AppException) { await transaction.RollbackAsync(); throw; }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            throw new AppException($"Lỗi khi tạo phòng ban: {ex.Message}", 500, "S01");
        }
    }

    /// <summary>Cập nhật trạng thái phòng ban (kích hoạt / vô hiệu)</summary>
    public async Task<BaseResponse<bool>> UpdateDepartmentAsync(Guid departmentId, UpdateDepartmentReqDto request)
    {
        var userId = _userContext.GetUserId();
        var isAdmin = _userContext.IsInRole("Admin");

        var department = await _unitOfWork.Repository<DepartmentEntity>().Query()
            .Include(d => d.CinemaInfoEntity)
            .Include(d => d.SharedUserInfoEntity)
                .ThenInclude(u => u!.StaffProfileEntity)
            .FirstOrDefaultAsync(d => d.DepartmentId == departmentId);

        if (department == null)
            throw new AppException("Không tìm thấy phòng ban.", 404, "DEPT_ERR");

        if (!isAdmin && department.CinemaInfoEntity.FacilitiesManagerId != userId)
            throw new AppException("Bạn không có quyền sửa phòng ban này.", 403, "DEPT_ERR");

        // 1. Kiểm tra tính duy nhất của tên nếu đổi tên hoặc kích hoạt lại phòng ban
        bool nameChanging = request.DepartmentName != null && request.DepartmentName != department.DepartmentName;
        bool activating = request.IsActive == true && !department.IsActive;

        if (nameChanging || activating)
        {
            string targetName = request.DepartmentName ?? department.DepartmentName;
            var exists = await _unitOfWork.Repository<DepartmentEntity>().Query()
                .AnyAsync(d => d.CinemaId == department.CinemaId && 
                               d.DepartmentName == targetName && 
                               d.IsActive && 
                               d.DepartmentId != departmentId);
            if (exists)
                throw new AppException($"Phòng ban '{targetName}' đã tồn tại trong rạp này.", 400, "DEPT_ERR");
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
                Message = "Cập nhật phòng ban thành công."
            };
        }
        catch (AppException) { await transaction.RollbackAsync(); throw; }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            throw new AppException($"Lỗi khi cập nhật phòng ban: {ex.Message}", 500, "DEPT_ERR");
        }
    }

    /// <summary>Xoá mềm phòng ban</summary>
    public async Task<BaseResponse<bool>> DeleteDepartmentAsync(Guid departmentId)
    {
        var userId = _userContext.GetUserId();
        var isAdmin = _userContext.IsInRole("Admin");

        var department = await _unitOfWork.Repository<DepartmentEntity>().Query()
            .Include(d => d.CinemaInfoEntity)
            .Include(d => d.SharedUserInfoEntity)
                .ThenInclude(u => u!.StaffProfileEntity)
            .FirstOrDefaultAsync(d => d.DepartmentId == departmentId);

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
