using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text;
using System.Web;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.IdentityAccess.Responses;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.IdentityAccess;

public class GoogleLoginInitUseCase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleLoginInitUseCase> _logger;

    private const string GoogleAuthEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";

    public GoogleLoginInitUseCase(IConfiguration configuration, ILogger<GoogleLoginInitUseCase> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public BaseResponse<ResGoogleLoginInitDto> Execute(string platform)
    {
        var clientId = _configuration["Google:ClientId"];
        if (string.IsNullOrEmpty(clientId))
        {
            _logger.LogError("Google ClientId is not configured");
            throw new AppException(Messages.System.Error, 500, "G01");
        }

        string redirectUri = GetCallbackUri(platform);

        var stateData = new { platform = platform, nonce = Guid.NewGuid().ToString("N") };
        var stateJson = JsonSerializer.Serialize(stateData);
        var stateBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(stateJson));

        var queryParams = new Dictionary<string, string>
        {
            { "client_id", clientId },
            { "redirect_uri", redirectUri },
            { "response_type", "code" },
            { "scope", "openid email profile" },
            { "access_type", "offline" },
            { "prompt", "consent" },
            { "state", stateBase64 }
        };

        var queryString = string.Join("&", queryParams.Select(kvp =>
            $"{HttpUtility.UrlEncode(kvp.Key)}={HttpUtility.UrlEncode(kvp.Value)}"));

        var redirectUrl = $"{GoogleAuthEndpoint}?{queryString}";

        return new BaseResponse<ResGoogleLoginInitDto>
        {
            IsSuccess = true,
            Data = new ResGoogleLoginInitDto { RedirectUrl = redirectUrl },
            Message = "Google login URL generated successfully"
        };
    }

    private string GetCallbackUri(string platform)
    {
        return platform.ToLower() switch
        {
            "web" => _configuration["Google:WebCallbackUrl"]
                     ?? "https://renewcinemaprojectfrontend.vercel.app/auth/google-callback",
            "mobile" => _configuration["Google:MobileCallbackUrl"]
                         ?? "https://renewcinemaprojectfrontend.vercel.app/auth/google-callback-mobile",
            _ => throw new AppException("Invalid platform. Use 'web' or 'mobile'", 400, "G05")
        };
    }
}
