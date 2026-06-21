using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Admin;
using Cinema.Application.Interfaces;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Admin.UserManagement;

public class SetUserStatusUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAdminUserRepository _adminUserRepository;
    private readonly IAuditLogService _auditLogService;

    public SetUserStatusUseCase(
        IUnitOfWork unitOfWork,
        IAdminUserRepository adminUserRepository,
        IAuditLogService auditLogService)
    {
        _unitOfWork = unitOfWork;
        _adminUserRepository = adminUserRepository;
        _auditLogService = auditLogService;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(Guid userId, AccountStatusEnum status)
    {
        var user = await _adminUserRepository.FindUserByIdAsync(userId);
        if (user == null)
        {
            return new BaseResponse<string>
            {
                IsSuccess = false,
                Message = "User not found."
            };
        }

        user.AccountStatus = status;
        _unitOfWork.Repository<UserInfoEntity>().Update(user);
        
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
}

