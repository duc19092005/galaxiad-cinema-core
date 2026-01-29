

using BusinessLayer.Dtos;
using BusinessLayer.Dtos.IdentityAccess;
using BusinessLayer.Interfaces.IIdentityAccess;

namespace BusinessLayer.Services.IdentityAccess;

public class UserProfileService
{
    private readonly IProfileBehavior _profileBehavior;

    public UserProfileService(IProfileBehavior profileBehavior)
    {
        this._profileBehavior = profileBehavior;
    }
    public async Task<BaseResponse<string>> ChangePassword(ReqChangePasswordDto request)
    {
        var results = await _profileBehavior.ChangePassword(request);
        return results;
    }

    public async Task<BaseResponse<ResRegularLoginDto>> GetAccess()
    {
        var results = await _profileBehavior.GetAccess();
        return results;
    }
}
