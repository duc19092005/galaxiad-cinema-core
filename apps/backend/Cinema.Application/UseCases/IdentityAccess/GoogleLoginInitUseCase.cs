using System;
using System.Text.Json;
using System.Text;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.IdentityAccess.Responses;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.IdentityAccess;

public class GoogleLoginInitUseCase
{
    private readonly IGoogleAuthService _googleAuthService;

    public GoogleLoginInitUseCase(IGoogleAuthService googleAuthService)
    {
        _googleAuthService = googleAuthService;
    }

    public BaseResponse<ResGoogleLoginInitDto> Execute(string platform)
    {
        var stateData = new { platform = platform, nonce = Guid.NewGuid().ToString("N") };
        var stateJson = JsonSerializer.Serialize(stateData);
        var stateBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(stateJson));

        var redirectUrl = _googleAuthService.BuildAuthorizationUrl(platform, stateBase64);

        return new BaseResponse<ResGoogleLoginInitDto>
        {
            IsSuccess = true,
            Data = new ResGoogleLoginInitDto { RedirectUrl = redirectUrl },
            Message = Messages.Platform.GoogleLoginUrlGenerated
        };
    }
}
