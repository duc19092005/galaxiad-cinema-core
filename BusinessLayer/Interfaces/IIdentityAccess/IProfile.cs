using BusinessLayer.Dtos;
using BusinessLayer.Dtos.IdentityAccess.Requests;
using BusinessLayer.Dtos.IdentityAccess.Responses;

namespace BusinessLayer.Interfaces.IIdentityAccess;

public interface IProfileBehavior
{
    Task<BaseResponse<string>> ChangePassword(ReqChangePasswordDto request);
    
    Task<BaseResponse<ResRegularLoginDto>> GetAccess();

    Task<BaseResponse<ResGetUserInfo>> GetUserProfile();
}
