using Cinema.Application.Dtos;
using Cinema.Application.Dtos.IdentityAccess.Requests;
using Cinema.Application.Dtos.IdentityAccess.Responses;

namespace Cinema.Application.Interfaces.IIdentityAccess;

public interface IProfileBehavior
{
    Task<BaseResponse<string>> ChangePassword(ReqChangePasswordDto request);
    
    Task<BaseResponse<ResRegularLoginDto>> GetAccess();

    Task<BaseResponse<ResGetUserInfo>> GetUserProfile();

    Task<BaseResponse<string>> UpdateUserProfile(ReqUpdateUserProfileDto request);
}
