using BussinessLayer.Dtos;
using BussinessLayer.Dtos.Identity_Access;
using BussinessLayer.Interfaces.i_identity_access;

namespace BussinessLayer.Services.Identity_access;

public class userProfileService
{
    private readonly IProfileBehavior IProfileBehavior;

    public userProfileService(IProfileBehavior IProfileBehavior)
    {
        this.IProfileBehavior = IProfileBehavior;
    }
    public async Task<base_reponse<string>> ChangePassword(req_change_password_dto request)
    {
        var results = await IProfileBehavior.ChangePassword(request);
        return results;
    }

    public async Task<base_reponse<regular_login_res_dto>> GetAccess()
    {
        var results = await IProfileBehavior.GetAccess();
        return results;
    }
}