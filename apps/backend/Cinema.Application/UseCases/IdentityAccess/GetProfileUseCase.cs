using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.IdentityAccess.Responses;
using Cinema.Application.Interfaces.IIdentityAccess;
using Cinema.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.IdentityAccess;

public class GetProfileUseCase
{
    private readonly IIdentityAccessRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly ILogger<GetProfileUseCase> _logger;

    public GetProfileUseCase(
        IIdentityAccessRepository repository,
        IUserContextService userContextService,
        ILogger<GetProfileUseCase> logger)
    {
        _repository = repository;
        _userContextService = userContextService;
        _logger = logger;
    }

    public async Task<BaseResponse<ResRegularLoginDto>> ExecuteAsync()
    {
        try
        {
            var userId = _userContextService.GetUserId();
            var user = await _repository.FindUserByIdAsync(userId);
            if (user == null)
            {
                throw new AppException(Messages.Auth.UserNotFound, 404, "UN01");
            }

            var rolesIds = await _repository.GetUserRoleIdsAsync(userId);
            var resultRoles = await _repository.FindUserByIdWithRolesAsync(userId);
            var roles = resultRoles?.UserRoleInfoEntity
                .Select(r => r.RoleListInfoEntity.RoleName)
                .ToArray() ?? [];

            var result = new ResRegularLoginDto
            {
                UserId = user.UserId,
                Username = user.UserName,
                PortraitImageUrl = user.PortraitImageUrl,
                Roles = roles,
                AccessToken = null
            };

            result.IsSharedPosAccount = await _repository.IsSharedPosAccountAsync(userId);

            if (string.IsNullOrEmpty(result.Username))
            {
                _logger.LogError("User with Id {0} Profile Not Found", userId);
            }

            if (result.Roles == null || result.Roles.Length == 0)
            {
                throw new AppException(Messages.Auth.RoleNotFound, 403, "UN02");
            }

            if (result.Roles.Contains("Admin"))
            {
                result.ManagedCinemas = await _repository.GetActiveCinemasAsync();
            }
            else if (result.Roles.Contains("TheaterManager") || result.Roles.Contains("FacilitiesManager"))
            {
                var managedCinemas = await _repository.GetManagedCinemasAsync(userId);
                if (managedCinemas.Any())
                {
                    result.ManagedCinemas = managedCinemas;
                }
            }

            return new BaseResponse<ResRegularLoginDto>
            {
                IsSuccess = true,
                Data = result,
                Message = Messages.Auth.ValidateSuccess
            };
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "System error in getAccess");
            throw new AppException(Messages.System.GeneralError, 500, "S01");
        }
    }
}
