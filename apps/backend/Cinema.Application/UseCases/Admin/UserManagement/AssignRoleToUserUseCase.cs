using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Admin;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Admin;
using Cinema.Application.Interfaces;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Admin.UserManagement;

public class AssignRoleToUserUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAdminUserRepository _adminUserRepository;
    private readonly IAuditLogService _auditLogService;

    public AssignRoleToUserUseCase(
        IUnitOfWork unitOfWork,
        IAdminUserRepository adminUserRepository,
        IAuditLogService auditLogService)
    {
        _unitOfWork = unitOfWork;
        _adminUserRepository = adminUserRepository;
        _auditLogService = auditLogService;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(Guid userId, UpdateUserRoleRequestDto dto)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var user = await _adminUserRepository.FindUserByIdAsync(userId);
            if (user == null)
            {
                return new BaseResponse<string> { IsSuccess = false, Message = Messages.Admin.UserNotFound };
            }

            var normalizedRoleIds = AdminUserManagementHelper.NormalizeStaffRoleIds(dto.RoleIds);
            await AdminUserManagementHelper.ReplaceStaffRolesAsync(_unitOfWork, _adminUserRepository, userId, normalizedRoleIds, dto.CinemaId, dto.DepartmentId, null, dto.EmployeeType);

            await _auditLogService.WriteAsync(
                "Update",
                "UserRole",
                user.UserId,
                user.UserEmail,
                normalizedRoleIds.Count == 0 ? "Cleared staff roles." : "Updated staff roles.");

            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            return new BaseResponse<string> { IsSuccess = true, Message = Messages.Admin.StaffRolesUpdated };
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}

