using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Admin.Responses;
using BusinessLayer.Services.Admin.Audit;
using BusinessLayer.Entities.CinemaInfos;
using BusinessLayer.Constants;
using Microsoft.EntityFrameworkCore;
using Shared.Enums;
using BusinessLayer.Entities.UserInfos;
using BusinessLayer.Interfaces.IThirdPersonServices;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using Shared.Exceptions;
using Shared.Interfaces.Persistence;

namespace BusinessLayer.Services.Admin.UserManagement;

public class AdminUserDto
{
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? PortraitImageUrl { get; set; }

    public string UserRoles { get; set; } = string.Empty;
    public AccountStatusEnum AccountStatus { get; set; }
    public RegisterMethodEnum RegisterMethod { get; set; }
}

public class AdminManageUserService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AdminManageUserService> _logger;
    private readonly AuditLogService _auditLogService;
    private readonly IImageStorageService _imageStorageService;

    public AdminManageUserService(IUnitOfWork unitOfWork, ILogger<AdminManageUserService> logger, AuditLogService auditLogService, IImageStorageService imageStorageService)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
        _auditLogService = auditLogService;
        _imageStorageService = imageStorageService;
    }

    public async Task<BaseResponse<List<AdminUserDto>>> GetAllUsersAsync()
    {
        var users = await Query<UserInfoEntity>()
            .OrderByDescending(u => u.UserId)
            .Select(u => new AdminUserDto
            {
                UserId = u.UserId,
                UserEmail = u.UserEmail,
                UserName = u.UserName ?? string.Empty,
                PortraitImageUrl = u.PortraitImageUrl,
                AccountStatus = u.AccountStatus,
                RegisterMethod = u.RegisterMethod,
                UserRoles = String.Join("," , u.UserRoleInfoEntity.Select(x => x.RoleListInfoEntity.RoleName))
            })
            .ToListAsync();

        return new BaseResponse<List<AdminUserDto>>
        {
            IsSuccess = true,
            Data = users,
            Message = "Get all users successfully."
        };
    }

    public async Task<BaseResponse<string>> SetUserStatusAsync(Guid userId, AccountStatusEnum status)
    {
        var user = await Repository<UserInfoEntity>().FindAsync(userId);
        if (user == null)
        {
            return new BaseResponse<string>
            {
                IsSuccess = false,
                Message = "User not found."
            };
        }

        user.AccountStatus = status;
        Repository<UserInfoEntity>().Update(user);
        await _auditLogService.WriteAsync(
            "Update",
            "User",
            user.UserId,
            user.UserEmail,
            $"Updated user status to {status}.");
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<string>
        {
            IsSuccess = true,
            Data = null,
            Message = $"User status updated to {status} successfully."
        };
    }

    public async Task<BaseResponse<string>> AssignRoleToUserAsync(Guid userId, List<Guid> roleIds)
    {
        await using var transactions = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var user = await Repository<UserInfoEntity>().FindAsync(userId);
            if (user == null) return new BaseResponse<string> { IsSuccess = false, Message = "User not found." };

            var isValidRole = await Query<RoleListInfoEntity>().AnyAsync(r => roleIds.Contains(r.RoleId));

            if (!isValidRole)
            {
                throw new NotFoundException("Error role is invalid");
            }

            // Protect the Admin role: Don't delete it if it exists
            var adminRoleId = BusinessLayer.Constants.userRoles.Admin;
            
            bool hasAdminPreviously = await Query<UserRoleInfoEntity>()
                .AnyAsync(ur => ur.UserId == userId && ur.RoleId == adminRoleId);

            await Query<UserRoleInfoEntity>()
                .Where(ur => ur.UserId == userId && ur.RoleId != adminRoleId)
                .ExecuteDeleteAsync();

            // Add new roles, but skip Admin if they already have it to avoid duplicates
            var rolesToAdd = roleIds
                .Where(id => !(id == adminRoleId && hasAdminPreviously))
                .Select(x => new UserRoleInfoEntity
                {
                    UserId = userId,
                    RoleId = x
                }).ToList();

            if (rolesToAdd.Any())
            {
                await Repository<UserRoleInfoEntity>().AddRangeAsync(rolesToAdd);
            }

            // Tự động khởi tạo StaffProfileEntity nếu gán vai trò nhân viên (staff role)
            var staffRoleIds = new[] 
            { 
                userRoles.Cashier, 
                userRoles.TheaterManager, 
                userRoles.FacilitiesManager, 
                userRoles.MovieManager 
            };

            bool isStaff = roleIds.Any(r => staffRoleIds.Contains(r));
            if (isStaff)
            {
                var hasProfile = await Query<StaffProfileEntity>()
                    .AnyAsync(sp => sp.UserId == userId);

                if (!hasProfile)
                {
                    var firstCinema = await Query<CinemaInfoEntity>().FirstOrDefaultAsync();
                    if (firstCinema == null)
                    {
                        throw new AppException("Không thể gán vai trò nhân viên vì hệ thống chưa có chi nhánh rạp nào được tạo.", 400, "ROLE_ERR");
                    }

                    var newProfile = new StaffProfileEntity
                    {
                        UserId = userId,
                        WorkingStatus = true,
                        CinemaId = firstCinema.CinemaId,
                        IsCinemaManager = roleIds.Contains(userRoles.TheaterManager),
                        FaceVector = null
                    };

                    await Repository<StaffProfileEntity>().AddAsync(newProfile);
                }
            }

            await _auditLogService.WriteAsync(
                "Update",
                "UserRole",
                user.UserId,
                user.UserEmail,
                "Updated user roles.");

            await _unitOfWork.SaveChangesAsync();
            await transactions.CommitAsync();

            return new BaseResponse<string> { IsSuccess = true, Message = $"Role Assign Completed successfully." };
        }
        catch (Exception e)
        {
            _logger.LogError(e.Message);
            await transactions.RollbackAsync();
            if (e is AppException)
            {
                throw;
            }
            throw CustomSystemException.SystemExceptionCaller();

        }
    }

    public async Task<BaseResponse<string>> AssignCinemaToManagerAsync(Guid cinemaId, Guid managerId)
    {
        var cinema = await Repository<CinemaInfoEntity>().FindAsync(cinemaId);
        if (cinema == null) return new BaseResponse<string> { IsSuccess = false, Message = "Cinema not found." };

        var userRole = await Query<UserRoleInfoEntity>()
            .Include(ur => ur.RoleListInfoEntity)
            .FirstOrDefaultAsync(ur => ur.UserId == managerId && 
                                       (ur.RoleListInfoEntity.RoleName == "TheaterManager" || ur.RoleListInfoEntity.RoleName == "FacilitiesManager"));

        if (userRole == null) return new BaseResponse<string> { IsSuccess = false, Message = "User must be a TheaterManager or FacilitiesManager." };

        if (userRole.RoleListInfoEntity.RoleName == "TheaterManager")
        {
            cinema.TheaterManagerId = managerId;
        }
        else
        {
            cinema.FacilitiesManagerId = managerId;
        }
        
        Repository<CinemaInfoEntity>().Update(cinema);
        await _auditLogService.WriteAsync(
            "Update",
            "Cinema",
            cinema.CinemaId,
            cinema.CinemaName,
            $"Assigned {userRole.RoleListInfoEntity.RoleName} to cinema {cinema.CinemaName}.",
            cinema.CinemaId);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<string> { IsSuccess = true, Message = "Assigned cinema successfully." };
    }

    public async Task<BaseResponse<string>> UpdateUserPortraitAsync(Guid userId, IFormFile? portrait)
    {
        if (portrait == null || portrait.Length == 0)
        {
            return new BaseResponse<string> { IsSuccess = false, Message = "Portrait image is required." };
        }

        var user = await Repository<UserInfoEntity>().FindAsync(userId);
        if (user == null)
        {
            return new BaseResponse<string> { IsSuccess = false, Message = "User not found." };
        }

        var oldPortraitUrl = user.PortraitImageUrl;
        var uploadResult = await _imageStorageService.PostImageAsync(portrait);
        if (!uploadResult.Success)
        {
            return new BaseResponse<string> { IsSuccess = false, Message = uploadResult.Result };
        }

        user.PortraitImageUrl = uploadResult.Result;
        Repository<UserInfoEntity>().Update(user);

        await _auditLogService.WriteAsync(
            "Update",
            "UserPortrait",
            user.UserId,
            user.UserEmail,
            "Updated user portrait image.");

        await _unitOfWork.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(oldPortraitUrl))
        {
            _ = await _imageStorageService.DeleteImageAsync(oldPortraitUrl);
        }

        return new BaseResponse<string>
        {
            IsSuccess = true,
            Data = uploadResult.Result,
            Message = "Portrait image updated successfully."
        };
    }

    public async Task<List<string>> GetUserRolesAsync(Guid userId)
    {
        return await Query<UserRoleInfoEntity>()
            .AsNoTracking()
            .Where(x => x.UserId.Equals(userId))
            .Select(x => x.RoleListInfoEntity.RoleName)
            .ToListAsync();
    }

    public async Task<List<ResponseRolesDto>> GetAssignableRolesAsync()
    {
        return await Query<RoleListInfoEntity>()
            .AsNoTracking()
            .Where(x => x.RoleId != userRoles.Admin && x.RoleId != userRoles.Customer)
            .Select(x => new ResponseRolesDto
            {
                RoleId = x.RoleId,
                RoleName = x.RoleName
            })
            .ToListAsync();
    }

    public async Task<BaseResponse<List<ResponsePermissionDto>>> GetAllPermissionsAsync()
    {
        var permissions = await Query<PermissionEntity>()
            .AsNoTracking()
            .Select(p => new ResponsePermissionDto
            {
                PermissionId = p.PermissionId,
                PermissionInfo = p.PermissionInfo
            })
            .ToListAsync();

        return new BaseResponse<List<ResponsePermissionDto>>
        {
            IsSuccess = true,
            Data = permissions,
            Message = "Lấy danh sách quyền thành công."
        };
    }

    public async Task<BaseResponse<List<ResponseRolePermissionsDto>>> GetRolesPermissionsAsync()
    {
        var roles = await Query<RoleListInfoEntity>()
            .AsNoTracking()
            .Select(r => new ResponseRolePermissionsDto
            {
                RoleId = r.RoleId,
                RoleName = r.RoleName,
                Permissions = r.PermissionForRoleEntities.Select(pr => new ResponsePermissionDto
                {
                    PermissionId = pr.PermissionId,
                    PermissionInfo = pr.PermissionEntity.PermissionInfo
                }).ToList()
            })
            .ToListAsync();

        return new BaseResponse<List<ResponseRolePermissionsDto>>
        {
            IsSuccess = true,
            Data = roles,
            Message = "Lấy danh sách vai trò và quyền thành công."
        };
    }

    public async Task<BaseResponse<string>> UpdateRolePermissionsAsync(Guid roleId, List<Guid> permissionIds)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var role = await Repository<RoleListInfoEntity>().FindAsync(roleId);
            if (role == null)
            {
                return new BaseResponse<string> { IsSuccess = false, Message = "Không tìm thấy vai trò." };
            }

            // Xóa tất cả quyền cũ của vai trò này
            await Query<PermissionForRoleEntity>()
                .Where(pr => pr.RoleId == roleId)
                .ExecuteDeleteAsync();

            // Gán danh sách quyền mới
            var newMappings = permissionIds.Select(pid => new PermissionForRoleEntity
            {
                RoleId = roleId,
                PermissionId = pid
            }).ToList();

            if (newMappings.Any())
            {
                await Repository<PermissionForRoleEntity>().AddRangeAsync(newMappings);
            }

            await _auditLogService.WriteAsync(
                "Update",
                "RolePermissions",
                roleId,
                role.RoleName,
                $"Cập nhật danh sách quyền cho vai trò {role.RoleName}.");

            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            return new BaseResponse<string>
            {
                IsSuccess = true,
                Message = $"Cập nhật quyền cho vai trò {role.RoleName} thành công."
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex.Message);
            await transaction.RollbackAsync();
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    private IQueryable<TEntity> Query<TEntity>() where TEntity : class
    {
        return Repository<TEntity>().Query();
    }

    private IRepository<TEntity> Repository<TEntity>() where TEntity : class
    {
        return _unitOfWork.Repository<TEntity>();
    }
}

public class ResponsePermissionDto
{
    public Guid PermissionId { get; set; }
    public string PermissionInfo { get; set; } = string.Empty;
}

public class ResponseRolePermissionsDto
{
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public List<ResponsePermissionDto> Permissions { get; set; } = [];
}
