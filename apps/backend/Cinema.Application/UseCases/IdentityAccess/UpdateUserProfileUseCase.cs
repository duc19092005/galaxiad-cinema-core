using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.IdentityAccess.Requests;
using Cinema.Application.Interfaces.IIdentityAccess;
using Cinema.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.IdentityAccess;

public class UpdateUserProfileUseCase
{
    private readonly IIdentityAccessRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly ILogger<UpdateUserProfileUseCase> _logger;

    public UpdateUserProfileUseCase(
        IIdentityAccessRepository repository,
        IUserContextService userContextService,
        ILogger<UpdateUserProfileUseCase> logger)
    {
        _repository = repository;
        _userContextService = userContextService;
        _logger = logger;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(ReqUpdateUserProfileDto request)
    {
        try
        {
            var userId = _userContextService.GetUserId();
            var profile = await _repository.FindUserByIdAsync(userId);

            if (profile == null)
            {
                throw new AppException(Messages.Auth.UserInfoNotFound, 404, "Error01");
            }

            if (request.DateOfBirth.HasValue)
            {
                var today = DateTime.Today;
                var age = today.Year - request.DateOfBirth.Value.Year;
                if (request.DateOfBirth.Value.Date > today.AddYears(-age)) age--;

                if (age < 16 || age > 80)
                {
                    throw new BadRequestException("Tuổi phải từ 16 đến 80.", "V01");
                }
                profile.DateOfBirth = request.DateOfBirth.Value;
            }

            if (!string.IsNullOrEmpty(request.UserName))
            {
                profile.UserName = request.UserName;
            }

            if (!string.IsNullOrEmpty(request.PhoneNumber))
            {
                profile.PhoneNumber = request.PhoneNumber;
            }

            if (!string.IsNullOrEmpty(request.IdentityCode))
            {
                profile.IdentityCode = request.IdentityCode;
            }

            await _repository.SaveChangesAsync();

            return new BaseResponse<string>
            {
                IsSuccess = true,
                Message = "Cập nhật thông tin cá nhân thành công."
            };
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user profile");
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
}
