using BusinessLayer.Dtos;
using BusinessLayer.Dtos.IdentityAccess.Responses;
using BusinessLayer.UseCases.IdentityAccess;

namespace BusinessLayer.Services.IdentityAccess;

public class GoogleLoginService
{
    private readonly GoogleLoginUseCase _googleLoginUseCase;

    public GoogleLoginService(GoogleLoginUseCase googleLoginUseCase)
    {
        _googleLoginUseCase = googleLoginUseCase;
    }

    /// <summary>
    /// Khởi tạo Google OAuth flow - trả về redirect URL
    /// </summary>
    public BaseResponse<ResGoogleLoginInitDto> InitGoogleLogin(string platform)
    {
        return _googleLoginUseCase.InitGoogleLogin(platform);
    }

    /// <summary>
    /// Xử lý Google OAuth callback
    /// </summary>
    public async Task<BaseResponse<ResGoogleLoginDto>> HandleGoogleCallback(string code, string state)
    {
        return await _googleLoginUseCase.HandleGoogleCallback(code, state);
    }
}
