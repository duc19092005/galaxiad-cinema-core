

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

public class identityAccessRegularLoginUseCase : ILogin_interface<reqRegularLoginDto , resRegularLoginDto>
{
    private readonly cinemaDbContext _dbContext;
    
    private readonly IConfiguration _configuration;
    
    private readonly ILogger<identityAccessRegularLoginUseCase> _logger;

    public identityAccessRegularLoginUseCase(cinemaDbContext dbContext, IConfiguration configuration,
        ILogger<identityAccessRegularLoginUseCase> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<baseResponse<resRegularLoginDto>> Login(reqRegularLoginDto dto)
    {
        try
        {
            var getUserInfo = await _dbContext.user_info_entity.FirstOrDefaultAsync(x => x.userEmail.Equals(dto.email));
            if (getUserInfo == null)
            {
                throw new appException("User Not Found", 404 , "UN01");
            }
            else
            {
                var validatePassword = BCrypt_helper.Validate(getUserInfo.password , dto.password);
                if (!validatePassword)
                {
                    throw new appException("Username or password is wrong", 401, "UN01");
                }
                else
                {

                    var result = await _dbContext.user_info_entity
                        .AsNoTracking() 
                        .Where(x => x.userId == getUserInfo.userId)
                        .Select(x => new 
                        {
                            UserId = x.userId,
                            Username = _dbContext.user_profile_entity
                                .Where(p => p.userID == x.userId)
                                .Select(p => p.userName)
                                .FirstOrDefault(),
                            Roles = x.user_role_info_entity 
                                .Select(r => r.role_list_info_entity.roleName)
                                .ToArray()
                        })
                        .FirstOrDefaultAsync();

                    if (!result.Roles.Any())
                    {
                        _logger.LogError("User with Id {0} Role Not Found" , getUserInfo.userId);
                        throw new appException("User Not Found", 403, "UN01");
                    }

                    if (result == null)
                    {
                        _logger.LogError("User with Id {0} Profile Not Found" , getUserInfo.userId);
                        throw new appException("User Not Found", 404, "UN01");
                    }
                    
                    // Sign JWT for User
                    string? getJWTKey = _configuration["JWT_Info:Key"];
                    string? getJWTIss = _configuration["JWT_Info:Iss"];
                    string? getJwtAud = _configuration["JWT_Info:Aud"];

                    if (getJWTKey == null || getJWTIss == null || getJwtAud == null)
                    {
                        _logger.LogError("JWT_Info:Key and JWT_Info:Iss not null");
                        throw new appException("System Error", StatusCodes.Status500InternalServerError, "E01");
                    }
                    string? token = Jwt_helper.Encrypt(getJWTKey , getJWTIss , getJwtAud , getUserInfo.userEmail ,result.Username, getUserInfo.userId , result.Roles);

                    if (token == null)
                    {
                        _logger.LogError("Token Generator System Error");
                        throw new appException("System Error", StatusCodes.Status500InternalServerError, "E01");
                    }

                    return new baseResponse<resRegularLoginDto>()
                    {
                        isSuccess = true,
                        data = new resRegularLoginDto()
                        {
                            userId = getUserInfo.userId,
                            access_token = token,
                            roles = result.Roles,
                            username = result.Username
                        },
                        message = "Login SuccessFully"
                    };
                }
            }
        }
        catch (appException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new appException("There's an error with the system", 500, "S01");
        }
    }
}