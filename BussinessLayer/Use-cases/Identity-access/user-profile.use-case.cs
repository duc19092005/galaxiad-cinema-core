using System.Security.Claims;
using Backend.Shard.Exceptions;
using BussinessLayer.Dtos;
using BussinessLayer.Dtos.Identity_Access;
using BussinessLayer.Interfaces.i_identity_access;
using DataAccess;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Shared.Ultis;

namespace BussinessLayer.Use_cases.Identity_access;

public class identityAccessUserProfileUseCase : IProfileBehavior
{
    private readonly dbContext _dbContext;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<identityAccessUserProfileUseCase> _logger;

    public identityAccessUserProfileUseCase(dbContext dbContext, IHttpContextAccessor httpContextAccessor,
        ILogger<identityAccessUserProfileUseCase> logger)
    {
        this._dbContext = dbContext;
        this._httpContextAccessor = httpContextAccessor;
        this._logger = logger;
    }
    
    public async Task<baseResponse<resRegularLoginDto>> GetAccess()
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
                .Select(x => new resRegularLoginDto
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

            return new baseResponse<resRegularLoginDto>()
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
    
    public async Task<baseResponse<string>> ChangePassword(reqChangePasswordDto request)
    {
        try
        {
            // Get User Id
            var getUserId = Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(
                ClaimTypes.Sid)?.Value);

            var findUser = await _dbContext.user_info_entity.FirstOrDefaultAsync(x => x.userId.Equals(getUserId));

            if (findUser == null)
            {
                throw new app_exception("Cannot Find User Information", 404, "Error01");
            }
            else
            {
                if (!BCrypt_helper.Validate(findUser.password, request.OldPassword))
                {
                    throw new app_exception("Old Password is Not Match !", 400, "Error02");
                }else if (!BCrypt_helper.Validate(findUser.password, request.NewPassword))
                {
                    throw new app_exception("New Password is the same of old password !", 400, "Error02");
                }else
                {
                    var newPassword = BCrypt_helper.Hash(request.NewPassword);
                    findUser.password = newPassword;
                    await _dbContext.SaveChangesAsync();
                    return new baseResponse<string>()
                    {
                        isSuccess = true,
                        data = null,
                        message = "Change Password Completed"
                    };
                }

            }
        }
        catch (app_exception)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex , ex.Message);
            throw system_exception.system_exception_caller();
        }
    }

    public async Task<baseResponse<resGetUserInfo>> GetUserProfile()
    {
        return null!;
    }
}