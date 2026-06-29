using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Admin;
using Cinema.Application.Interfaces.Admin;
using Cinema.Application.Exceptions;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.Admin.UserManagement;

public class AdminUpdateUserProfileUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAdminUserRepository _adminUserRepository;
    private readonly ILogger<AdminUpdateUserProfileUseCase> _logger;

    public AdminUpdateUserProfileUseCase(
        IUnitOfWork unitOfWork,
        IAdminUserRepository adminUserRepository,
        ILogger<AdminUpdateUserProfileUseCase> logger)
    {
        _unitOfWork = unitOfWork;
        _adminUserRepository = adminUserRepository;
        _logger = logger;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(Guid userId, AdminUpdateUserProfileDto dto)
    {
        try
        {
            var user = await _adminUserRepository.FindUserByIdAsync(userId);
            if (user == null)
            {
                return new BaseResponse<string> { IsSuccess = false, Message = Messages.Admin.UserNotFound };
            }

            if (!string.IsNullOrWhiteSpace(dto.UserName))
                user.UserName = dto.UserName.Trim();

            if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
                user.PhoneNumber = dto.PhoneNumber.Trim();

            if (dto.DateOfBirth.HasValue)
            {
                var today = DateTime.Today;
                var age = today.Year - dto.DateOfBirth.Value.Year;
                if (dto.DateOfBirth.Value.Date > today.AddYears(-age)) age--;
                if (age < 16 || age > 80)
                    throw new AppException("Tuổi nhân viên phải từ 16 đến 80.", 400, "PROFILE_ERR");
                user.DateOfBirth = dto.DateOfBirth.Value;
            }

            await _unitOfWork.SaveChangesAsync();

            return new BaseResponse<string>
            {
                IsSuccess = true,
                Message = "Cập nhật thông tin nhân viên thành công."
            };
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user profile for userId={UserId}", userId);
            throw;
        }
    }
}
