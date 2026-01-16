using BussinessLayer.Dtos;
using BussinessLayer.Dtos.Identity_Access;

namespace BussinessLayer.Interfaces.i_identity_access;

public interface IProfileBehavior
{
    Task<baseResponse<string>> ChangePassword(reqChangePasswordDto request);
    
    Task<baseResponse<resRegularLoginDto>> GetAccess();

    Task<baseResponse<resGetUserInfo>> GetUserProfile();
}