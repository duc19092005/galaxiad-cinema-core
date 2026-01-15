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
            var userIdStr = _httpContextAccessor.HttpContext.User.FindFirst(ClaimTypes.Sid)?.Value;
            if (!Guid.TryParse(userIdStr, out var userId))
            {
                throw new app_exception("Invalid Token", 401, "AUTH01");
            }
            var result = await _dbContext.user_info_entity
                .AsNoTracking()
                .Where(x => x.userId == userId)
                .Select(x => new regular_login_res_dto
                {
                    userId = x.userId,
                    username = _dbContext.user_profile_entity
                                .Where(p => p.userID == x.userId)
                                .Select(p => p.userName)
                                .FirstOrDefault(),
                    roles = _dbContext.user_role_info_entity
                                .Where(r => r.userId == x.userId)
                                .Select(r => r.role_list_info_entity.roleName)
                                .ToArray(),
                    access_token = null
                })
                .FirstOrDefaultAsync();

            if (result == null) 
                throw new app_exception("User Not Found", 404, "UN01");
            
            if (string.IsNullOrEmpty(result.username))
                _logger.LogError("User with Id {0} Profile Not Found", userId);

            if (result.roles == null || result.roles.Length == 0)
                throw new app_exception("User Role Not Found", 403, "UN02");

            return new base_reponse<regular_login_res_dto>()
            {
                isSuccess = true,
                data = result,
                message = "Validate Successfully"
            };
        }
        catch (app_exception) { throw; }
        catch (Exception ex)
        {
            _logger.LogError(ex, "System error in getAccess");
            throw new app_exception("There's an error with the system", 500, "S01");
        }
    }
}