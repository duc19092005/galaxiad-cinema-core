using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Localization;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.IdentityAccess.Requests;
using Cinema.Application.Dtos.IdentityAccess.Responses;
using Cinema.Application.Interfaces.IIdentityAccess;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.IdentityAccess;

public class identityAccessRegularLoginUseCase : ILogin<ReqRegularLoginDto, ResRegularLoginDto>
{
    private readonly IIdentityAccessRepository _repository;
    private readonly IConfiguration _configuration;
    private readonly ILogger<identityAccessRegularLoginUseCase> _logger;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;

    public identityAccessRegularLoginUseCase(
        IIdentityAccessRepository repository,
        IConfiguration configuration,
        ILogger<identityAccessRegularLoginUseCase> logger,
        IPasswordHasher passwordHasher,
        IJwtService jwtService)
    {
        _repository = repository;
        _configuration = configuration;
        _logger = logger;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
    }

    public async Task<BaseResponse<ResRegularLoginDto>> Login(ReqRegularLoginDto dto)
    {
        try
        {
            var getUserInfo = await _repository.FindUserByEmailAsync(dto.Email);
            if (getUserInfo == null || getUserInfo.AccountStatus != AccountStatusEnum.Active)
            {
                throw new AppException(Messages.Auth.UserNotFound, 404, "UN01");
            }
            
            var validatePassword = _passwordHasher.Validate(getUserInfo.Password, dto.Password);
            if (!validatePassword)
            {
                throw new AppException(Messages.Auth.WrongCredentials, 401, "UN01");
            }

            var result = await _repository.FindUserByIdWithRolesAsync(getUserInfo.UserId);
            if (result == null)
            {
                _logger.LogError("User with Id {0} Profile Not Found", getUserInfo.UserId);
                throw new AppException(Messages.Auth.UserNotFound, 404, "UN01");
            }

            var roles = result.UserRoleInfoEntity
                .Select(r => r.RoleListInfoEntity.RoleName)
                .ToArray();

            if (roles.Length == 0)
            {
                _logger.LogError("User with Id {0} Role Not Found", getUserInfo.UserId);
                throw new AppException(Messages.Auth.UserNotFound, 403, "UN01");
            }
            
            var rolesIds = await _repository.GetUserRoleIdsAsync(getUserInfo.UserId);
            var permissions = (await _repository.GetUserPermissionsAsync(rolesIds)).ToArray();

            string? getJWTKey = _configuration["JWT_Info:Key"];
            string? getJWTIss = _configuration["JWT_Info:Iss"];
            string? getJwtAud = _configuration["JWT_Info:Aud"];

            if (getJWTKey == null || getJWTIss == null || getJwtAud == null)
            {
                _logger.LogError("JWT_Info:Key and JWT_Info:Iss not null");
                throw new AppException(Messages.System.Error, StatusCodes.Status500InternalServerError, "E01");
            }

            string? token = _jwtService.GenerateToken(getJWTKey, getJWTIss, getJwtAud, getUserInfo.UserEmail, result.UserName, getUserInfo.UserId, roles, permissions);
            if (token == null)
            {
                _logger.LogError("Token Generator System Error");
                throw new AppException(Messages.System.Error, StatusCodes.Status500InternalServerError, "E01");
            }

            List<ManagedCinemaInfoDto>? managedCinemasList = null;
            var isSharedPosAccount = await _repository.IsSharedPosAccountAsync(getUserInfo.UserId);

            if (roles.Contains("Admin"))
            {
                managedCinemasList = await _repository.GetActiveCinemasAsync();
            }
            else if (roles.Contains("TheaterManager") || roles.Contains("FacilitiesManager"))
            {
                managedCinemasList = await _repository.GetManagedCinemasAsync(getUserInfo.UserId);
            }

            return new BaseResponse<ResRegularLoginDto>
            {
                IsSuccess = true,
                Data = new ResRegularLoginDto
                {
                    UserId = getUserInfo.UserId,
                    AccessToken = token,
                    Roles = roles,
                    Username = result.UserName,
                    IsSharedPosAccount = isSharedPosAccount,
                    ManagedCinemas = managedCinemasList
                },
                Message = Messages.Auth.LoginSuccess
            };
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new AppException(Messages.System.GeneralError, 500, "S01");
        }
    }
}
