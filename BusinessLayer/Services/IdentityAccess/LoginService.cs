using BusinessLayer.Dtos;
using BusinessLayer.Dtos.IdentityAccess;
using BusinessLayer.Factories.IdentityAccess;
using Shared.Enums;

namespace BusinessLayer.Services.IdentityAccess;

public class LoginService
{
    private readonly LoginFactory _loginFactory;
    
    public LoginService(LoginFactory loginFactory)
    {
        this._loginFactory = loginFactory;
    }
    
    public async Task<BaseResponse<ResRegularLoginDto>> Login(ReqRegularLoginDto regularLoginReqDto)
    {
        var objects = _loginFactory.Login<ReqRegularLoginDto, ResRegularLoginDto>(RegisterMethodEnum.UsernamePassword);
        var results = await objects.Login(regularLoginReqDto);
        return results;
    }
}
