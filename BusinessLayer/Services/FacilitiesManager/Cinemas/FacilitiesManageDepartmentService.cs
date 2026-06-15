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

        var departments = await _unitOfWork.Repository<CashierDepartmentEntity>().Query()
            .Include(d => d.CinemaInfoEntity)
            .Include(d => d.SharedUserInfoEntity)
            .Where(d => d.CinemaId == cinemaId)
            .Select(d => new ResDepartmentDto
            {
                DepartmentId = d.DepartmentId,
                CinemaId = d.CinemaId,
                CinemaName = d.CinemaInfoEntity.CinemaName,
                DepartmentName = d.DepartmentName,
                DepartmentType = d.DepartmentType == CashierDepartmentType.TicketPOS ? "TicketPOS" : "FoodPOS",
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
        var exists = await _unitOfWork.Repository<CashierDepartmentEntity>().Query()
            .AnyAsync(d => d.CinemaId == request.CinemaId && d.DepartmentName == request.DepartmentName && d.IsActive);
        if (exists)
            throw new AppException($"Phòng ban '{request.DepartmentName}' đã tồn tại trong rạp này.", 400, "DEPT_ERR");

        var departmentId = Guid.NewGuid();
        var sharedUserId = Guid.NewGuid();
        var email = $"{request.DepartmentType.ToString().ToLower()}_{departmentId:N}@cinema.com";
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
                WorkingStatus = true,
                IsCinemaManager = false
            });

            // 4. Create Department
            await _unitOfWork.Repository<CashierDepartmentEntity>().AddAsync(new CashierDepartmentEntity
            {
                DepartmentId = departmentId,
                CinemaId = request.CinemaId,
                DepartmentName = request.DepartmentName,
                DepartmentType = request.DepartmentType,
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

        var department = await _unitOfWork.Repository<CashierDepartmentEntity>().Query()
            .Include(d => d.CinemaInfoEntity)
            .FirstOrDefaultAsync(d => d.DepartmentId == departmentId);

        if (department == null)
            throw new AppException("Không tìm thấy phòng ban.", 404, "DEPT_ERR");

        if (!isAdmin && department.CinemaInfoEntity.FacilitiesManagerId != userId)
            throw new AppException("Bạn không có quyền sửa phòng ban này.", 403, "DEPT_ERR");

        if (request.DepartmentName != null)
            department.DepartmentName = request.DepartmentName;

        if (request.IsActive.HasValue)
            department.IsActive = request.IsActive.Value;

        _unitOfWork.Repository<CashierDepartmentEntity>().Update(department);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = "Cập nhật phòng ban thành công."
        };
    }

    /// <summary>Xoá mềm phòng ban</summary>
    public async Task<BaseResponse<bool>> DeleteDepartmentAsync(Guid departmentId)
    {
        var userId = _userContext.GetUserId();
        var isAdmin = _userContext.IsInRole("Admin");

        var department = await _unitOfWork.Repository<CashierDepartmentEntity>().Query()
            .Include(d => d.CinemaInfoEntity)
            .FirstOrDefaultAsync(d => d.DepartmentId == departmentId);

        if (department == null)
            throw new AppException("Không tìm thấy phòng ban.", 404, "DEPT_ERR");

        if (!isAdmin && department.CinemaInfoEntity.FacilitiesManagerId != userId)
            throw new AppException("Bạn không có quyền xoá phòng ban này.", 403, "DEPT_ERR");

        department.IsActive = false;
        _unitOfWork.Repository<CashierDepartmentEntity>().Update(department);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = "Đã vô hiệu hoá phòng ban."
        };
    }
}
