using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Admin;
using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Application.Interfaces.Admin;

public interface IAdminUserRepository
{
    Task<List<AdminUserDto>> GetAllUsersAsync();
    Task<UserInfoEntity?> FindUserByIdAsync(Guid userId);
    Task<bool> EmailExistsAsync(string email);
    Task<bool> IdentityCodeExistsAsync(string encryptedIdentityCode);
    Task<List<string>> GetUserRolesAsync(Guid userId);
    Task<List<ResponseRolesDto>> GetAssignableRolesAsync(Guid[] staffRoleIds);
    Task<BaseResponse<List<ResponsePermissionDto>>> GetAllPermissionsAsync();
    Task<BaseResponse<List<ResponseRolePermissionsDto>>> GetRolesPermissionsAsync();
    Task<RoleListInfoEntity?> FindRoleByIdAsync(Guid roleId);
    Task DeletePermissionForRoleAsync(Guid roleId);
    Task<int> CountPermissionsAsync(List<Guid> permissionIds);
    Task DeleteStaffRolesAsync(Guid userId, Guid[] staffRoleIds);
    Task<StaffProfileEntity?> FindStaffProfileAsync(Guid userId);
    Task<DepartmentEntity?> FindActiveDepartmentAsync(Guid departmentId);
    Task<CinemaInfoEntity?> FindActiveCinemaAsync(Guid cinemaId);
    Task<CinemaInfoEntity?> FindFirstActiveCinemaAsync();
}
