using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Cinema.Infrastructure.ExternalServices.Identity;

public class GoogleAuthService : IGoogleAuthService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleAuthService> _logger;

    private const string GoogleAuthEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
    private const string GoogleTokenEndpoint = "https://oauth2.googleapis.com/token";
    private const string GoogleUserInfoEndpoint = "https://www.googleapis.com/oauth2/v2/userinfo";

    public GoogleAuthService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<GoogleAuthService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public string BuildAuthorizationUrl(string platform, string state)
    {
        var clientId = _configuration["Google:ClientId"] ?? "";
        var redirectUri = GetCallbackUri(platform);

        var queryParams = new Dictionary<string, string>
        {
            { "client_id", clientId },
            { "redirect_uri", redirectUri },
            { "response_type", "code" },
            { "scope", "openid email profile" },
            { "access_type", "offline" },
            { "prompt", "consent" },
            { "state", state }
        };

        var queryString = string.Join("&", queryParams.Select(kvp =>
            $"{Uri.EscapeDataString(kvp.Key)}={Uri.EscapeDataString(kvp.Value)}"));

        return $"{GoogleAuthEndpoint}?{queryString}";
    }

    public async Task<GoogleUserProfile?> AuthenticateCodeAsync(string code, string platform, CancellationToken ct = default)
    {
        var redirectUri = GetCallbackUri(platform);
        var token = await ExchangeCodeForTokensAsync(code, redirectUri, ct);
        if (token == null || string.IsNullOrEmpty(token.AccessToken))
        {
            return null;
        }

        var userInfo = await GetGoogleUserInfoAsync(token.AccessToken, ct);
        if (userInfo == null || string.IsNullOrEmpty(userInfo.Email))
        {
            return null;
        }

        return new GoogleUserProfile
        {
            Id = userInfo.Id,
            Email = userInfo.Email,
            Name = userInfo.Name,
            Picture = userInfo.Picture,
            RefreshToken = token.RefreshToken
        };
    }

    private string GetCallbackUri(string platform)
    {
        return platform.ToLowerInvariant() switch
        {
            "ios" => _configuration["Google:RedirectUri:Ios"] ?? "com.cinema.app:/oauth2redirect",
            "android" => _configuration["Google:RedirectUri:Android"] ?? "com.cinema.app:/oauth2redirect",
            _ => _configuration["Google:RedirectUri:Web"] ?? "http://localhost:3000/auth/google/callback"
        };
    }

    private async Task<GoogleTokenResponse?> ExchangeCodeForTokensAsync(string code, string redirectUri, CancellationToken ct)
    {
        try
        {
            var clientId = _configuration["Google:ClientId"];
            var clientSecret = _configuration["Google:ClientSecret"];

            var client = _httpClientFactory.CreateClient();
            var parameters = new Dictionary<string, string>
            {
                { "code", code },
                { "client_id", clientId ?? "" },
                { "client_secret", clientSecret ?? "" },
                { "redirect_uri", redirectUri },
                { "grant_type", "authorization_code" }
            };

            var content = new FormUrlEncodedContent(parameters);
            var response = await client.PostAsync(GoogleTokenEndpoint, content, ct);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("Google token exchange failed: {Error}", errorContent);
                return null;
            }

            var responseContent = await response.Content.ReadAsStringAsync(ct);
            return JsonSerializer.Deserialize<GoogleTokenResponse>(responseContent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception during Google token exchange");
            return null;
        }
    }

    private async Task<GoogleUserInfo?> GetGoogleUserInfoAsync(string accessToken, CancellationToken ct)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

            var response = await client.GetAsync(GoogleUserInfoEndpoint, ct);
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("Failed to get Google user info: {Error}", errorContent);
                return null;
            }

            var responseContent = await response.Content.ReadAsStringAsync(ct);
            return JsonSerializer.Deserialize<GoogleUserInfo>(responseContent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception getting Google user info");
            return null;
        }
    }

    private class GoogleTokenResponse
    {
        [JsonPropertyName("access_token")] public string AccessToken { get; set; } = string.Empty;
        [JsonPropertyName("refresh_token")] public string? RefreshToken { get; set; }
        [JsonPropertyName("expires_in")] public int ExpiresIn { get; set; }
        [JsonPropertyName("token_type")] public string TokenType { get; set; } = string.Empty;
        [JsonPropertyName("id_token")] public string? IdToken { get; set; }
        [JsonPropertyName("scope")] public string? Scope { get; set; }
    }

    private class GoogleUserInfo
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("email")] public string Email { get; set; } = string.Empty;
        [JsonPropertyName("verified_email")] public bool VerifiedEmail { get; set; }
        [JsonPropertyName("name")] public string? Name { get; set; }
        [JsonPropertyName("given_name")] public string? GivenName { get; set; }
        [JsonPropertyName("family_name")] public string? FamilyName { get; set; }
        [JsonPropertyName("picture")] public string? Picture { get; set; }
    }
}
