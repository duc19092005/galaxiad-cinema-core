
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.IdentityAccess.Requests;
using BusinessLayer.Factories.IdentityAccess;
using Shared.Enums;


namespace BusinessLayer.Services.IdentityAccess;

public class RegisterService
{
    private readonly RegisterFactory _registerFactory ;
    
    public RegisterService(RegisterFactory registerFactory)
    {
        this._registerFactory = registerFactory;
    }
    public async Task<BaseResponse<string>> Register(ReqRegularRegisterDto registerRegularIdentityAccessDto)
    {
        var objects =  
            _registerFactory.Create<ReqRegularRegisterDto , string>(RegisterMethodEnum.UsernamePassword);
        var results = await objects.Add(registerRegularIdentityAccessDto);
        return results;
    }
}
