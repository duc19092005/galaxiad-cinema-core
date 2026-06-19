using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Admin;
using Cinema.Application.Interfaces;
using Cinema.Domain.Interfaces.Persistence;

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

    public async Task<BaseResponse<string>> ExecuteAsync(Guid userId, List<Guid> roleIds)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var user = await _adminUserRepository.FindUserByIdAsync(userId);
            if (user == null)
            {
                return new BaseResponse<string> { IsSuccess = false, Message = "User not found." };
            }

            var normalizedRoleIds = AdminUserManagementHelper.NormalizeStaffRoleIds(roleIds);
            await AdminUserManagementHelper.ReplaceStaffRolesAsync(_unitOfWork, _adminUserRepository, userId, normalizedRoleIds, null, null, null);

            await _auditLogService.WriteAsync(
                "Update",
                "UserRole",
                user.UserId,
                user.UserEmail,
                normalizedRoleIds.Count == 0 ? "Cleared staff roles." : "Updated staff roles.");

            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            return new BaseResponse<string> { IsSuccess = true, Message = "Staff roles updated successfully." };
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
