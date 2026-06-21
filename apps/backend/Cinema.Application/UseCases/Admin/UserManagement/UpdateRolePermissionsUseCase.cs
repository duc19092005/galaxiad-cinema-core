using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Cinema.Application.Constants;
using Cinema.Application.Dtos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Admin;
using Cinema.Application.Interfaces;
using Cinema.Application.Exceptions;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Admin.UserManagement;

public class UpdateRolePermissionsUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAdminUserRepository _adminUserRepository;
    private readonly ILogger<UpdateRolePermissionsUseCase> _logger;
    private readonly IAuditLogService _auditLogService;

    public UpdateRolePermissionsUseCase(
        IUnitOfWork unitOfWork,
        IAdminUserRepository adminUserRepository,
        ILogger<UpdateRolePermissionsUseCase> logger,
        IAuditLogService auditLogService)
    {
        _unitOfWork = unitOfWork;
        _adminUserRepository = adminUserRepository;
        _logger = logger;
        _auditLogService = auditLogService;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(Guid roleId, List<Guid> permissionIds)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var role = await _adminUserRepository.FindRoleByIdAsync(roleId);
            if (role == null)
            {
                return new BaseResponse<string> { IsSuccess = false, Message = "Role not found." };
            }

            await _adminUserRepository.DeletePermissionForRoleAsync(roleId);

            var nextPermissionIds = permissionIds.Distinct().ToList();
            if (nextPermissionIds.Contains(userPermissions.ApproveShift) &&
                roleId != userRoles.Admin &&
                roleId != userRoles.TheaterManager)
            {
                throw new BadRequestException("ApproveShift can only be assigned to Admin or TheaterManager.", "PERMISSION_ERR");
            }

            var validPermissionCount = await _adminUserRepository.CountPermissionsAsync(nextPermissionIds);
            if (validPermissionCount != nextPermissionIds.Count)
            {
                throw new BadRequestException("One or more permissions are invalid.", "PERMISSION_ERR");
            }

            var newMappings = nextPermissionIds.Select(pid => new PermissionForRoleEntity
            {
                RoleId = roleId,
                PermissionId = pid
            }).ToList();

            if (newMappings.Any())
            {
                await _unitOfWork.Repository<PermissionForRoleEntity>().AddRangeAsync(newMappings);
            }

            await _auditLogService.WriteAsync(
                "Update",
                "RolePermissions",
                roleId,
                role.RoleName,
                $"Updated permissions for role {role.RoleName}.");

            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            return new BaseResponse<string>
            {
                IsSuccess = true,
                Message = $"Permissions updated for role {role.RoleName}."
            };
        }
        catch (AppException)
        {
            await transaction.RollbackAsync();
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.Message);
            await transaction.RollbackAsync();
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
}
