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

public class GetUserProfileUseCase : IProfileBehavior
{
    private readonly dbContext _dbContext;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<GetUserProfileUseCase> _logger;

    public GetUserProfileUseCase(dbContext dbContext, IHttpContextAccessor httpContextAccessor,
        ILogger<GetUserProfileUseCase> logger)
    {
        this._dbContext = dbContext;
        this._httpContextAccessor = httpContextAccessor;
        this._logger = logger;
    }
    
    public async Task<base_reponse<string>> ChangePassword(req_change_password_dto request)
    {
        try
        {
            // Get User Id
            var GetUserId = Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(
                ClaimTypes.Sid)?.Value);

            var findUser = await _dbContext.user_info_entity.FirstOrDefaultAsync(x => x.userId.Equals(GetUserId));

            if (findUser == null)
            {
                throw new app_exception("Cannot Find User Information", 404, "Error01");
            }
            else
            {
                if (!BCrypt_helper.Validate(findUser.password, request.NewPassword))
                {
                    throw new app_exception("Password is Invalid", 400, "Error02");
                }
                else
                {
                    var newPassword = BCrypt_helper.Hash(request.NewPassword);
                    findUser.password = newPassword;
                    await _dbContext.SaveChangesAsync();
                    return new base_reponse<string>()
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

    public async Task<base_reponse<res_get_user_profile_dto>> GetUserProfile()
    {
        return null!;
    }
}