// ReSharper disable All

using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Web;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.IdentityAccess.Requests;
using BusinessLayer.Dtos.IdentityAccess.Responses;
using BusinessLayer.Services.IdentityAccess;
using BusinessLayer.Constants;
using BusinessLayer.Entities.UserInfos;
using Shared.Interfaces.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shared.Enums;
using Shared.Exceptions;
using Shared.Localization;
using Shared.Utils;

namespace BusinessLayer.UseCases.IdentityAccess;

public class GoogleLoginUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleLoginUseCase> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    // Google OAuth2 Endpoints
    private const string GoogleAuthEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
    private const string GoogleTokenEndpoint = "https://oauth2.googleapis.com/token";
    private const string GoogleUserInfoEndpoint = "https://www.googleapis.com/oauth2/v2/userinfo";

    public GoogleLoginUseCase(
        IUnitOfWork unitOfWork,
        IConfiguration configuration,
        ILogger<GoogleLoginUseCase> logger,
        IHttpClientFactory httpClientFactory)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }


    public BaseResponse<ResGoogleLoginInitDto> InitGoogleLogin(string platform)
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

        return new BaseResponse<ResGoogleLoginInitDto>()
        {
            IsSuccess = true,
            Data = new ResGoogleLoginInitDto { RedirectUrl = redirectUrl },
            Message = "Google login URL generated successfully"
        };
    }


    public async Task<BaseResponse<ResGoogleLoginDto>> HandleGoogleCallback(string code, string state)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var userRepository = _unitOfWork.Repository<UserInfoEntity>();
            var userRoleRepository = _unitOfWork.Repository<UserRoleInfoEntity>();

            // 1. Parse state để lấy platform
            string platform = "web";
            try
            {
                var stateJson = Encoding.UTF8.GetString(Convert.FromBase64String(state));
                var stateObj = JsonSerializer.Deserialize<JsonElement>(stateJson);
                platform = stateObj.GetProperty("platform").GetString() ?? "web";
            }
            catch
            {
                _logger.LogWarning("Failed to parse state parameter, defaulting to web");
            }

            string redirectUri = GetCallbackUri(platform);

            // 2. Exchange authorization code -> access_token + refresh_token
            var tokenResponse = await ExchangeCodeForTokens(code, redirectUri);
            if (tokenResponse == null)
            {
                throw new AppException("Failed to exchange Google authorization code", 400, "G02");
            }

            // 3. Lấy user info từ Google
            var googleUserInfo = await GetGoogleUserInfo(tokenResponse.AccessToken);
            if (googleUserInfo == null || string.IsNullOrEmpty(googleUserInfo.Email))
            {
                throw new AppException("Failed to get Google user info", 400, "G03");
            }

            // 4. Check user đã tồn tại chưa
            var existingUser = await userRepository.Query()
                .Include(u => u.UserRoleInfoEntity)
                    .ThenInclude(r => r.RoleListInfoEntity)
                .FirstOrDefaultAsync(u => u.UserEmail == googleUserInfo.Email);

            bool isNewAccount = false;
            Guid userId;
            string username;
            string[] roles;

            if (existingUser != null)
            {
                // User đã tồn tại
                if (existingUser.AccountStatus != AccountStatusEnum.Active)
                {
                    throw new AppException(Messages.Auth.UserNotFound, 403, "G04");
                }

                // Chặn nếu người dùng trước đó đã đăng ký bằng Tài khoản/Mật khẩu
                if (existingUser.RegisterMethod != RegisterMethodEnum.Google)
                {
                    throw new AppException(Messages.Auth.GoogleAccountExists, 400, "G06");
                }

                userId = existingUser.UserId;
                username = existingUser.UserName ?? googleUserInfo.Name ?? googleUserInfo.Email;
                roles = existingUser.UserRoleInfoEntity
                    .Select(r => r.RoleListInfoEntity.RoleName)
                    .ToArray();

                // Cập nhật SubId (Google Subject ID) nếu chưa có
                if (string.IsNullOrEmpty(existingUser.SubId))
                {
                    existingUser.SubId = googleUserInfo.Id;
                }

                // Mã hóa và lưu refresh token mới từ Google
                if (!string.IsNullOrEmpty(tokenResponse.RefreshToken))
                {
                    var aesKey = _configuration["AES_256:Key"];
                    var aesIv = _configuration["AES_256:IV"];
                    if (!string.IsNullOrEmpty(aesKey) && !string.IsNullOrEmpty(aesIv))
                    {
                        existingUser.RefreshToken = AES256Helper.Encrypt(tokenResponse.RefreshToken, aesKey, aesIv);
                    }
                }

                await _unitOfWork.SaveChangesAsync();
                isNewAccount = false;
            }
            else
            {
                // Tạo tài khoản mới
                userId = Guid.NewGuid();
                username = googleUserInfo.Name ?? googleUserInfo.Email;
                isNewAccount = true;

                // Mã hóa refresh token
                string? encryptedRefreshToken = null;
                if (!string.IsNullOrEmpty(tokenResponse.RefreshToken))
                {
                    var aesKey = _configuration["AES_256:Key"];
                    var aesIv = _configuration["AES_256:IV"];
                    if (!string.IsNullOrEmpty(aesKey) && !string.IsNullOrEmpty(aesIv))
                    {
                        encryptedRefreshToken = AES256Helper.Encrypt(tokenResponse.RefreshToken, aesKey, aesIv);
                    }
                }

                // Tạo UserInfo
                var rawIdentity = "GOOGLE_" + googleUserInfo.Id;
                var cryptoKey = _configuration["AES_256:Key"] ?? "";
                var cryptoIv = _configuration["AES_256:IV"] ?? "";
                var encryptedIdentity = AES256Helper.Encrypt(rawIdentity, cryptoKey, cryptoIv);

                await userRepository.AddAsync(new UserInfoEntity
                {
                    UserId = userId,
                    UserEmail = googleUserInfo.Email,
                    Password = "", // Google login không cần password
                    RegisterMethod = RegisterMethodEnum.Google,
                    AccountStatus = AccountStatusEnum.Active,
                    SubId = googleUserInfo.Id,
                    RefreshToken = encryptedRefreshToken,
                    UserName = username,
                    IdentityCode = encryptedIdentity,
                    DateOfBirth = DateTime.MinValue,
                    PhoneNumber = $"0{Random.Shared.Next(100000000, 999999999)}"
                });

                // Gán role Customer
                await userRoleRepository.AddAsync(new UserRoleInfoEntity
                {
                    UserId = userId,
                    RoleId = userRoles.Customer
                });

                // Add Customer Profile
                await _unitOfWork.Repository<CustomerProfileEntity>().AddAsync(new CustomerProfileEntity
                {
                    UserId = userId,
                    TotalPoint = 0,
                    UserSegmentId = user_segments_constant.MemberStandard
                });

                await _unitOfWork.SaveChangesAsync();
                roles = new[] { "Customer" };
            }

            // 5. Tạo JWT token
            string? jwtKey = _configuration["JWT_Info:Key"];
            string? jwtIss = _configuration["JWT_Info:Iss"];
            string? jwtAud = _configuration["JWT_Info:Aud"];

            if (string.IsNullOrEmpty(jwtKey) || string.IsNullOrEmpty(jwtIss) || string.IsNullOrEmpty(jwtAud))
            {
                _logger.LogError("JWT configuration is missing");
                throw new AppException(Messages.System.Error, 500, "E01");
            }

            var accessToken = Jwt_helper.Encrypt(jwtKey, jwtIss, jwtAud, googleUserInfo.Email, username, userId, roles);
            if (string.IsNullOrEmpty(accessToken))
            {
                _logger.LogError("Failed to generate JWT token for Google login");
                throw new AppException(Messages.System.Error, 500, "E01");
            }

            await transaction.CommitAsync();

            return new BaseResponse<ResGoogleLoginDto>
            {
                IsSuccess = true,
                Data = new ResGoogleLoginDto
                {
                    UserId = userId,
                    Username = username,
                    Email = googleUserInfo.Email,
                    Roles = roles,
                    AccessToken = accessToken,
                    IsNewAccount = isNewAccount,
                    AvatarUrl = googleUserInfo.Picture
                },
                Message = isNewAccount
                    ? Messages.Auth.RegisterSuccess
                    : Messages.Auth.LoginSuccess
            };
        }
        catch (AppException)
        {
            await transaction.RollbackAsync();
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Google OAuth callback");
            await transaction.RollbackAsync();
            throw new AppException(Messages.System.GeneralError, 500, "S01");
        }
    }

    #region Private Helpers

    /// <summary>
    /// Xác định callback URI dựa trên platform
    /// </summary>
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

    /// <summary>
    /// Exchange authorization code cho access_token và refresh_token từ Google
    /// </summary>
    private async Task<GoogleTokenResponse?> ExchangeCodeForTokens(string code, string redirectUri)
    {
        var clientId = _configuration["Google:ClientId"];
        var clientSecret = _configuration["Google:ClientSecret"];

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
        {
            _logger.LogError("Google ClientId or ClientSecret is not configured");
            throw new AppException(Messages.System.Error, 500, "G01");
        }

        var httpClient = _httpClientFactory.CreateClient();

        var requestBody = new Dictionary<string, string>
        {
            { "code", code },
            { "client_id", clientId },
            { "client_secret", clientSecret },
            { "redirect_uri", redirectUri },
            { "grant_type", "authorization_code" }
        };

        var response = await httpClient.PostAsync(GoogleTokenEndpoint, new FormUrlEncodedContent(requestBody));
        var responseContent = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Google token exchange failed: {StatusCode} - {Response}",
                response.StatusCode, responseContent);
            return null;
        }

        return JsonSerializer.Deserialize<GoogleTokenResponse>(responseContent);
    }

    /// <summary>
    /// Lấy user info từ Google bằng access token
    /// </summary>
    private async Task<GoogleUserInfo?> GetGoogleUserInfo(string accessToken)
    {
        var httpClient = _httpClientFactory.CreateClient();
        httpClient.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

        var response = await httpClient.GetAsync(GoogleUserInfoEndpoint);
        var responseContent = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Google user info request failed: {StatusCode} - {Response}",
                response.StatusCode, responseContent);
            return null;
        }

        return JsonSerializer.Deserialize<GoogleUserInfo>(responseContent);
    }

    #endregion
}

#region Google API Response Models

/// <summary>
/// Response từ Google Token Endpoint
/// </summary>
internal class GoogleTokenResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = string.Empty;

    [JsonPropertyName("refresh_token")]
    public string? RefreshToken { get; set; }

    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }

    [JsonPropertyName("token_type")]
    public string TokenType { get; set; } = string.Empty;

    [JsonPropertyName("id_token")]
    public string? IdToken { get; set; }

    [JsonPropertyName("scope")]
    public string? Scope { get; set; }
}

/// <summary>
/// Google User Info lấy từ Google API
/// </summary>
internal class GoogleUserInfo
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("verified_email")]
    public bool VerifiedEmail { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("given_name")]
    public string? GivenName { get; set; }

    [JsonPropertyName("family_name")]
    public string? FamilyName { get; set; }

    [JsonPropertyName("picture")]
    public string? Picture { get; set; }
}

#endregion
