// ReSharper disable All


using Backend.Shard.Exceptions;
using BussinessLayer.Dtos;
using BussinessLayer.Dtos.Identity_Access;
using BussinessLayer.Interfaces.i_identity_access;
using DataAccess;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shared.Ultis;

namespace BussinessLayer.Use_cases.Identity_access;

public class login_regular_use_case : ILogin_interface<regular_login_req_dto , regular_login_res_dto>
{
    private readonly dbContext _dbContext;
    
    private readonly IConfiguration _configuration;
    
    private readonly ILogger<login_regular_use_case> _logger;

    public login_regular_use_case(dbContext dbContext, IConfiguration configuration,
        ILogger<login_regular_use_case> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<base_reponse<regular_login_res_dto>> Login(regular_login_req_dto dto)
    {
        try
        {
            var getUserInfo = await _dbContext.user_info_entity.FirstOrDefaultAsync(x => x.userEmail.Equals(dto.email));
            if (getUserInfo == null)
            {
                throw new app_exception("User Not Found", 404 , "UN01");
            }
            else
            {
                var validatePassword = BCrypt_helper.Validate(getUserInfo.password , dto.password);
                if (!validatePassword)
                {
                    throw new app_exception("Invalid Password", 401, "UN01");
                }
                else
                {
                    // Get user Profile
                    var getUserProfile =
                        await _dbContext.user_profile_entity.FirstOrDefaultAsync(x => x.userID == getUserInfo.userId);

                    var getUserRoles =
                        _dbContext.user_role_info_entity
                            .Where(x => x.userId.Equals(getUserInfo.userId))
                            .Select(x => x.role_list_info_entity.roleName);

                    if (!getUserRoles.Any())
                    {
                        _logger.LogError("User with Id {0} Role Not Found" , getUserInfo.userId);
                        throw new app_exception("User Not Found", 403, "UN01");
                    }

                    if (getUserProfile == null)
                    {
                        _logger.LogError("User with Id {0} Profile Not Found" , getUserInfo.userId);
                        throw new app_exception("User Not Found", 404, "UN01");
                    }
                    
                    // Sign JWT for User
                    string? getJWTKey = _configuration["JWT_Info:Key"];
                    string? getJWTIss = _configuration["JWT_Info:Iss"];
                    string? getJwtAud = _configuration["JWT_Info:Aud"];

                    if (getJWTKey == null || getJWTIss == null || getJwtAud == null)
                    {
                        _logger.LogError("JWT_Info:Key and JWT_Info:Iss not null");
                        throw new app_exception("System Error", StatusCodes.Status500InternalServerError, "E01");
                    }
                    string? token = Jwt_helper.Encrypt(getJWTKey , getJWTIss , getJwtAud , getUserInfo.userEmail , getUserInfo.userId , getUserRoles.ToArray());

                    if (token == null)
                    {
                        _logger.LogError("Token Generator System Error");
                        throw new app_exception("System Error", StatusCodes.Status500InternalServerError, "E01");
                    }

                    return new base_reponse<regular_login_res_dto>()
                    {
                        isSuccess = true,
                        data = new regular_login_res_dto()
                        {
                            userId = getUserInfo.userId,
                            access_token = token,
                            roles = getUserRoles.ToArray(),
                            username = getUserProfile.userName
                        },
                        message = "Login SuccessFully"
                    };
                }
            }
        }
        catch (app_exception)
        {
            throw;
        }
        catch (Exception)
        {
            throw new app_exception("Database Error", 500, "S01");
        }
    }
}