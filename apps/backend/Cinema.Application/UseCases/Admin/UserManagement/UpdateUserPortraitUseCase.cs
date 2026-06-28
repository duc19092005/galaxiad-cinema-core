using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Cinema.Application.Dtos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Admin;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.Interfaces;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Admin.UserManagement;

public class UpdateUserPortraitUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAdminUserRepository _adminUserRepository;
    private readonly IImageStorageService _imageStorageService;
    private readonly IAuditLogService _auditLogService;

    public UpdateUserPortraitUseCase(
        IUnitOfWork unitOfWork,
        IAdminUserRepository adminUserRepository,
        IImageStorageService imageStorageService,
        IAuditLogService auditLogService)
    {
        _unitOfWork = unitOfWork;
        _adminUserRepository = adminUserRepository;
        _imageStorageService = imageStorageService;
        _auditLogService = auditLogService;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(Guid userId, IFormFile? portrait)
    {
        if (portrait == null || portrait.Length == 0)
        {
            return new BaseResponse<string> { IsSuccess = false, Message = Messages.Admin.PortraitRequired };
        }

        var user = await _adminUserRepository.FindUserByIdAsync(userId);
        if (user == null)
        {
            return new BaseResponse<string> { IsSuccess = false, Message = Messages.Admin.UserNotFound };
        }

        var oldPortraitUrl = user.PortraitImageUrl;
        var uploadResult = await _imageStorageService.PostImageAsync(portrait);
        if (!uploadResult.Success)
        {
            return new BaseResponse<string> { IsSuccess = false, Message = uploadResult.Result };
        }

        user.PortraitImageUrl = uploadResult.Result;
        _unitOfWork.Repository<UserInfoEntity>().Update(user);

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
            Message = Messages.Admin.PortraitUpdated
        };
    }
}

