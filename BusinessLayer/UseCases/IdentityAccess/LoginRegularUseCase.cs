

using Shared.Exceptions;
using Shared.Localization;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.IdentityAccess.Requests;
using BusinessLayer.Dtos.IdentityAccess.Responses;
using BusinessLayer.Interfaces.IIdentityAccess;
using DataAccess;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using BusinessLayer.Services.IdentityAccess;
using Shared.Enums;

namespace BusinessLayer.UseCases.IdentityAccess;

public class identityAccessRegularLoginUseCase : ILogin<ReqRegularLoginDto , ResRegularLoginDto>
{
    private readonly CinemaDbContext _dbContext;
    
    private readonly IConfiguration _configuration;
    
    private readonly ILogger<identityAccessRegularLoginUseCase> _logger;

    public identityAccessRegularLoginUseCase(CinemaDbContext dbContext, IConfiguration configuration,
        ILogger<identityAccessRegularLoginUseCase> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<BaseResponse<ResRegularLoginDto>> Login(ReqRegularLoginDto dto)
    {
        try
        {
            var getUserInfo = await _dbContext.UserInfoEntity.FirstOrDefaultAsync(x => x.UserEmail.Equals(dto.Email) && x.AccountStatus == AccountStatusEnum.Active);
            if (getUserInfo == null)
            {
                throw new AppException(Messages.Auth.UserNotFound, 404 , "UN01");
            }
            else
            {
                var validatePassword = BCrypt_helper.Validate(getUserInfo.Password , dto.Password);
                if (!validatePassword)
                {
                    throw new AppException(Messages.Auth.WrongCredentials, 401, "UN01");
                }
                else
                {

                    var result = await _dbContext.UserInfoEntity
                        .AsNoTracking() 
                        .Where(x => x.UserId == getUserInfo.UserId)
                        .Select(x => new 
                        {
                            UserId = x.UserId,
                            Username = x.UserName,
                            Roles = x.UserRoleInfoEntity 
                                .Select(r => r.RoleListInfoEntity.RoleName)
                                .ToArray()
                        })
                        .FirstOrDefaultAsync();

                    if (!result.Roles.Any())
                    {
                        _logger.LogError("User with Id {0} Role Not Found" , getUserInfo.UserId);
                        throw new AppException(Messages.Auth.UserNotFound, 403, "UN01");
                    }

                    if (result == null)
                    {
                        _logger.LogError("User with Id {0} Profile Not Found" , getUserInfo.UserId);
                        throw new AppException(Messages.Auth.UserNotFound, 404, "UN01");
                    }
                    
                    // Sign JWT for User
                    string? getJWTKey = _configuration["JWT_Info:Key"];
                    string? getJWTIss = _configuration["JWT_Info:Iss"];
                    string? getJwtAud = _configuration["JWT_Info:Aud"];

                    if (getJWTKey == null || getJWTIss == null || getJwtAud == null)
                    {
                        _logger.LogError("JWT_Info:Key and JWT_Info:Iss not null");
                        throw new AppException(Messages.System.Error, StatusCodes.Status500InternalServerError, "E01");
                    }
                    string? token = Jwt_helper.Encrypt(getJWTKey , getJWTIss , getJwtAud , getUserInfo.UserEmail ,result.Username, getUserInfo.UserId , result.Roles);

                    if (token == null)
                    {
                        _logger.LogError("Token Generator System Error");
                        throw new AppException(Messages.System.Error, StatusCodes.Status500InternalServerError, "E01");
                    }

                    return new BaseResponse<ResRegularLoginDto>()
                    {
                        IsSuccess = true,
                        Data = new ResRegularLoginDto()
                        {
                            UserId = getUserInfo.UserId,
                            AccessToken = token,
                            Roles = result.Roles,
                            Username = result.Username
                        },
                        Message = Messages.Auth.LoginSuccess
                    };
                }
            }
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



