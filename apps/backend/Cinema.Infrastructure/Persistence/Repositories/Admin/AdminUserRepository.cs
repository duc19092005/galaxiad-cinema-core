using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.Admin;
using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Admin;
using Cinema.Application.Dtos;

namespace Cinema.Infrastructure.Repositories;

public class AdminUserRepository : IAdminUserRepository
{
    private readonly CinemaDbContext _dbContext;

    public AdminUserRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<AdminUserDto>> GetAllUsersAsync()
    {
        return await _dbContext.Set<UserInfoEntity>()
            .OrderByDescending(u => u.UserId)
            .Select(u => new AdminUserDto
            {
                UserId = u.UserId,
                UserEmail = u.UserEmail,
                UserName = u.UserName ?? string.Empty,
                PortraitImageUrl = u.PortraitImageUrl,
                AccountStatus = u.AccountStatus,
                RegisterMethod = u.RegisterMethod,
                UserRoles = string.Join(",", u.UserRoleInfoEntity.Select(x => x.RoleListInfoEntity.RoleName)),
                CinemaName = u.StaffProfileEntity != null && u.StaffProfileEntity.CinemaInfoEntity != null 
                    ? u.StaffProfileEntity.CinemaInfoEntity.CinemaName 
                    : u.TheaterManagedCinemas.Any() 
                        ? u.TheaterManagedCinemas.First().CinemaName 
                        : u.FacilitiesManagedCinemas.Any() 
                            ? u.FacilitiesManagedCinemas.First().CinemaName 
                            : null
            })
            .ToListAsync();
    }

    public async Task<UserInfoEntity?> FindUserByIdAsync(Guid userId)
    {
        return await _dbContext.Set<UserInfoEntity>().FindAsync(userId);
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        return await _dbContext.Set<UserInfoEntity>().AnyAsync(x => x.UserEmail == email);
    }

    public async Task<bool> IdentityCodeExistsAsync(string encryptedIdentityCode)
    {
        return await _dbContext.Set<UserInfoEntity>().AnyAsync(x => x.IdentityCode == encryptedIdentityCode);
    }

    public async Task<List<string>> GetUserRolesAsync(Guid userId)
    {
        return await _dbContext.Set<UserRoleInfoEntity>()
            .AsNoTracking()
            .Where(x => x.UserId.Equals(userId))
            .Select(x => x.RoleListInfoEntity.RoleName)
            .ToListAsync();
    }

    public async Task<List<ResponseRolesDto>> GetAssignableRolesAsync(Guid[] staffRoleIds)
    {
        return await _dbContext.Set<RoleListInfoEntity>()
            .AsNoTracking()
            .Where(x => staffRoleIds.Contains(x.RoleId))
            .Select(x => new ResponseRolesDto
            {
                RoleId = x.RoleId,
                RoleName = x.RoleName
            })
            .ToListAsync();
    }

    public async Task<BaseResponse<List<ResponsePermissionDto>>> GetAllPermissionsAsync()
    {
        var permissions = await _dbContext.Set<PermissionEntity>()
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
            Message = "Permissions loaded successfully."
        };
    }

    public async Task<BaseResponse<List<ResponseRolePermissionsDto>>> GetRolesPermissionsAsync()
    {
        var roles = await _dbContext.Set<RoleListInfoEntity>()
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
            Message = "Role permissions loaded successfully."
        };
    }

    public async Task<RoleListInfoEntity?> FindRoleByIdAsync(Guid roleId)
    {
        return await _dbContext.Set<RoleListInfoEntity>().FindAsync(roleId);
    }

    public async Task DeletePermissionForRoleAsync(Guid roleId)
    {
        await _dbContext.Set<PermissionForRoleEntity>()
            .Where(pr => pr.RoleId == roleId)
            .ExecuteDeleteAsync();
    }

    public async Task<int> CountPermissionsAsync(List<Guid> permissionIds)
    {
        return await _dbContext.Set<PermissionEntity>()
            .CountAsync(permission => permissionIds.Contains(permission.PermissionId));
    }

    public async Task DeleteStaffRolesAsync(Guid userId, Guid[] staffRoleIds)
    {
        await _dbContext.Set<UserRoleInfoEntity>()
            .Where(ur => ur.UserId == userId && staffRoleIds.Contains(ur.RoleId))
            .ExecuteDeleteAsync();
    }

    public async Task<StaffProfileEntity?> FindStaffProfileAsync(Guid userId)
    {
        return await _dbContext.Set<StaffProfileEntity>()
            .FirstOrDefaultAsync(sp => sp.UserId == userId);
    }

    public async Task<DepartmentEntity?> FindActiveDepartmentAsync(Guid departmentId)
    {
        return await _dbContext.Set<DepartmentEntity>()
            .FirstOrDefaultAsync(d => d.DepartmentId == departmentId && d.IsActive);
    }

    public async Task<CinemaInfoEntity?> FindActiveCinemaAsync(Guid cinemaId)
    {
        return await _dbContext.Set<CinemaInfoEntity>()
            .FirstOrDefaultAsync(c => c.CinemaId == cinemaId && !c.IsDeleted);
    }

    public async Task<CinemaInfoEntity?> FindFirstActiveCinemaAsync()
    {
        return await _dbContext.Set<CinemaInfoEntity>()
            .FirstOrDefaultAsync(c => !c.IsDeleted);
    }
}
