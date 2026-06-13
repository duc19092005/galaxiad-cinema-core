

using Shared.Exceptions;
using Shared.Localization;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.IdentityAccess.Requests;
using BusinessLayer.Dtos.IdentityAccess.Responses;
using BusinessLayer.Interfaces.IIdentityAccess;
using BusinessLayer.Entities.UserInfos;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using BusinessLayer.Services.IdentityAccess;
using Shared.Interfaces.Persistence;
using Shared.Enums;

namespace BusinessLayer.UseCases.IdentityAccess;

public class identityAccessRegularLoginUseCase : ILogin<ReqRegularLoginDto , ResRegularLoginDto>
{
    private readonly IUnitOfWork _unitOfWork;
    
    private readonly IConfiguration _configuration;
    
    private readonly ILogger<identityAccessRegularLoginUseCase> _logger;

    public identityAccessRegularLoginUseCase(IUnitOfWork unitOfWork, IConfiguration configuration,
        ILogger<identityAccessRegularLoginUseCase> logger)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<BaseResponse<ResRegularLoginDto>> Login(ReqRegularLoginDto dto)
    {
        try
        {
            var userRepository = _unitOfWork.Repository<UserInfoEntity>();
            var getUserInfo = await userRepository.Query().FirstOrDefaultAsync(x => x.UserEmail.Equals(dto.Email) && x.AccountStatus == AccountStatusEnum.Active);
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

                    var result = await userRepository.Query()
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

                    if (result == null)
                    {
                        _logger.LogError("User with Id {0} Profile Not Found" , getUserInfo.UserId);
                        throw new AppException(Messages.Auth.UserNotFound, 404, "UN01");
                    }

                    if (!result.Roles.Any())
                    {
                        _logger.LogError("User with Id {0} Role Not Found" , getUserInfo.UserId);
                        throw new AppException(Messages.Auth.UserNotFound, 403, "UN01");
                    }
                    
                    // Fetch permissions corresponding to the user's roles
                    var rolesIds = await _unitOfWork.Repository<UserRoleInfoEntity>().Query()
                        .Where(ur => ur.UserId == getUserInfo.UserId)
                        .Select(ur => ur.RoleId)
                        .ToListAsync();

                    var permissions = await _unitOfWork.Repository<PermissionForRoleEntity>().Query()
                        .Where(pr => rolesIds.Contains(pr.RoleId))
                        .Select(pr => pr.PermissionEntity.PermissionInfo)
                        .Distinct()
                        .ToArrayAsync();

                    // Sign JWT for User
                    string? getJWTKey = _configuration["JWT_Info:Key"];
                    string? getJWTIss = _configuration["JWT_Info:Iss"];
                    string? getJwtAud = _configuration["JWT_Info:Aud"];

                    if (getJWTKey == null || getJWTIss == null || getJwtAud == null)
                    {
                        _logger.LogError("JWT_Info:Key and JWT_Info:Iss not null");
                        throw new AppException(Messages.System.Error, StatusCodes.Status500InternalServerError, "E01");
                    }
                    string? token = Jwt_helper.Encrypt(getJWTKey , getJWTIss , getJwtAud , getUserInfo.UserEmail ,result.Username, getUserInfo.UserId , result.Roles, permissions);

                    if (token == null)
                    {
                        _logger.LogError("Token Generator System Error");
                        throw new AppException(Messages.System.Error, StatusCodes.Status500InternalServerError, "E01");
                    }

                    List<ManagedCinemaInfoDto>? managedCinemasList = null;
                    if (result.Roles.Contains("Admin"))
                    {
                        managedCinemasList = await _unitOfWork.Repository<BusinessLayer.Entities.CinemaInfos.CinemaInfoEntity>().Query()
                            .Where(c => !c.IsDeleted)
                            .Select(c => new ManagedCinemaInfoDto
                            {
                                CinemaId = c.CinemaId,
                                CinemaName = c.CinemaName
                            })
                            .ToListAsync();
                    }
                    else if (result.Roles.Contains("TheaterManager") || result.Roles.Contains("FacilitiesManager"))
                    {
                        managedCinemasList = await _unitOfWork.Repository<BusinessLayer.Entities.CinemaInfos.CinemaInfoEntity>().Query()
                            .Where(c => !c.IsDeleted && (c.TheaterManagerId == getUserInfo.UserId || c.FacilitiesManagerId == getUserInfo.UserId))
                            .Select(c => new ManagedCinemaInfoDto
                            {
                                CinemaId = c.CinemaId,
                                CinemaName = c.CinemaName
                            })
                            .ToListAsync();
                    }

                    return new BaseResponse<ResRegularLoginDto>()
                    {
                        IsSuccess = true,
                        Data = new ResRegularLoginDto()
                        {
                            UserId = getUserInfo.UserId,
                            AccessToken = token,
                            Roles = result.Roles,
                            Username = result.Username,
                            ManagedCinemas = managedCinemasList
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



