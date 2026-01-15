using System.Security.Claims;
using Backend.Shard.Exceptions;
using BussinessLayer.Dtos;
using BussinessLayer.Dtos.Identity_Access;
using DataAccess;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shared.Ultis;

namespace BussinessLayer.Use_cases.Identity_access;

public class get_access_use_case
{
    private readonly dbContext _dbContext;
    
    private readonly ILogger<get_access_use_case> _logger;
    
    private readonly IConfiguration _configuration;
    
    private readonly IHttpContextAccessor  _httpContextAccessor;

    public get_access_use_case(dbContext dbContext, ILogger<get_access_use_case> _logger ,
        IConfiguration _configuration ,
        IHttpContextAccessor _httpContextAccessor)
    {
        _dbContext = dbContext;
        this._logger = _logger;
        this._configuration = _configuration;
        this._httpContextAccessor = _httpContextAccessor;
    }
    
    public async Task<base_reponse<regular_login_res_dto>> getAccess()
    {
        try
        {
            var getUserInfo = await _dbContext.user_info_entity.FirstOrDefaultAsync(x => x.userId.Equals(
                Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(
                    ClaimTypes.Sid).Value)));
            if (getUserInfo == null)
            {
                throw new app_exception("User Not Found", 404 , "UN01");
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
                return new base_reponse<regular_login_res_dto>()
                {
                    isSuccess = true,
                    data = new regular_login_res_dto()
                    {
                        userId = getUserInfo.userId,
                        access_token = null,
                        roles = getUserRoles.ToArray(),
                        username = getUserProfile.userName
                    },
                    message = "Validate SuccessFully"
                };
            }
        }
        catch (app_exception)
        {
            throw;
        }
        catch (Exception)
        {
            throw new app_exception("There's an error with the system", 500, "S01");
        }
    }
}