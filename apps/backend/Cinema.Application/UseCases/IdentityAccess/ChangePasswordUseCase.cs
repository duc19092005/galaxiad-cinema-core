using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.IdentityAccess.Requests;
using Cinema.Application.Interfaces.IIdentityAccess;
using Cinema.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.IdentityAccess;

public class ChangePasswordUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdentityAccessRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly ILogger<ChangePasswordUseCase> _logger;
    private readonly IPasswordHasher _passwordHasher;

    public ChangePasswordUseCase(
        IIdentityAccessRepository repository,
        IUserContextService userContextService,
        ILogger<ChangePasswordUseCase> logger,
        IPasswordHasher passwordHasher,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _userContextService = userContextService;
        _logger = logger;
        _passwordHasher = passwordHasher;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(ReqChangePasswordDto request)
    {
        try
        {
            var getUserId = _userContextService.GetUserId();
            var findUser = await _repository.FindUserByIdAsync(getUserId);

            if (findUser == null)
            {
                throw new AppException(Messages.Auth.UserInfoNotFound, 404, "Error01");
            }

            if (!_passwordHasher.Validate(findUser.Password, request.OldPassword!))
            {
                throw new AppException(Messages.Auth.OldPasswordNotMatch, 400, "Error02");
            }
            
            if (_passwordHasher.Validate(findUser.Password, request.NewPassword!))
            {
                throw new AppException(Messages.Auth.NewPasswordSameAsOld, 400, "Error02");
            }

            var newPassword = _passwordHasher.Hash(request.NewPassword!);
            findUser.Password = newPassword;
            await _unitOfWork.SaveChangesAsync();

            return new BaseResponse<string>
            {
                IsSuccess = true,
                Data = null,
                Message = Messages.Auth.ChangePasswordCompleted
            };
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.Message);
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
}
