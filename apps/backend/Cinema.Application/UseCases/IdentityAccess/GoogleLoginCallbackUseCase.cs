using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Cinema.Application.Abstractions.Security;
using Cinema.Domain.Constants;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.IdentityAccess.Responses;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.IIdentityAccess;
using Cinema.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Enums;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.IdentityAccess;

public class GoogleLoginCallbackUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdentityAccessRepository _repository;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleLoginCallbackUseCase> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IJwtService _jwtService;
    private readonly IEncryptionService _encryptionService;

    private const string GoogleTokenEndpoint = "https://oauth2.googleapis.com/token";
    private const string GoogleUserInfoEndpoint = "https://www.googleapis.com/oauth2/v2/userinfo";

    public GoogleLoginCallbackUseCase(
        IIdentityAccessRepository repository,
        IConfiguration configuration,
        ILogger<GoogleLoginCallbackUseCase> logger,
        IHttpClientFactory httpClientFactory,
        IJwtService jwtService,
        IUnitOfWork unitOfWork,
        IEncryptionService encryptionService)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _configuration = configuration;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _jwtService = jwtService;
        _encryptionService = encryptionService;
    }

    public async Task<BaseResponse<ResGoogleLoginDto>> ExecuteAsync(string code, string state)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
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

            var tokenResponse = await ExchangeCodeForTokens(code, redirectUri);
            if (tokenResponse == null)
            {
                throw new AppException(Messages.Auth.GoogleTokenExchangeFailed, 400, "G02");
            }

            var googleUserInfo = await GetGoogleUserInfo(tokenResponse.AccessToken);
            if (googleUserInfo == null || string.IsNullOrEmpty(googleUserInfo.Email))
            {
                throw new AppException(Messages.Auth.GoogleUserInfoFailed, 400, "G03");
            }

            var existingUser = await _repository.FindUserByEmailAsync(googleUserInfo.Email);

            bool isNewAccount = false;
            Guid userId;
            string username;
            string[] roles;

            if (existingUser != null)
            {
                if (existingUser.AccountStatus != AccountStatusEnum.Active)
                {
                    throw new AppException(Messages.Auth.UserNotFound, 403, "G04");
                }

                if (existingUser.RegisterMethod != RegisterMethodEnum.Google)
                {
                    throw new AppException(Messages.Auth.GoogleAccountExists, 400, "G06");
                }

                userId = existingUser.UserId;
                username = existingUser.UserName ?? googleUserInfo.Name ?? googleUserInfo.Email;
                
                var userRolesResult = await _repository.FindUserByIdWithRolesAsync(userId);
                roles = userRolesResult?.UserRoleInfoEntity
                    .Select(r => r.RoleListInfoEntity.RoleName)
                    .ToArray() ?? [];

                if (string.IsNullOrEmpty(existingUser.SubId))
                {
                    existingUser.SubId = googleUserInfo.Id;
                }

                if (!string.IsNullOrEmpty(tokenResponse.RefreshToken))
                {
                    var aesKey = _configuration["AES_256:Key"];
                    var aesIv = _configuration["AES_256:IV"];
                    if (!string.IsNullOrEmpty(aesKey) && !string.IsNullOrEmpty(aesIv))
                    {
                        existingUser.RefreshToken = _encryptionService.Encrypt(tokenResponse.RefreshToken, aesKey, aesIv);
                    }
                }

                await _unitOfWork.SaveChangesAsync();
                isNewAccount = false;
            }
            else
            {
                userId = Guid.NewGuid();
                username = googleUserInfo.Name ?? googleUserInfo.Email;
                isNewAccount = true;

                string? encryptedRefreshToken = null;
                if (!string.IsNullOrEmpty(tokenResponse.RefreshToken))
                {
                    var aesKey = _configuration["AES_256:Key"];
                    var aesIv = _configuration["AES_256:IV"];
                    if (!string.IsNullOrEmpty(aesKey) && !string.IsNullOrEmpty(aesIv))
                    {
                        encryptedRefreshToken = _encryptionService.Encrypt(tokenResponse.RefreshToken, aesKey, aesIv);
                    }
                }

                var rawIdentity = "GOOGLE_" + googleUserInfo.Id;
                var cryptoKey = _configuration["AES_256:Key"] ?? "";
                var cryptoIv = _configuration["AES_256:IV"] ?? "";
                var encryptedIdentity = _encryptionService.Encrypt(rawIdentity, cryptoKey, cryptoIv);

                await _repository.AddUserAsync(new UserInfoEntity
                {
                    UserId = userId,
                    UserEmail = googleUserInfo.Email,
                    Password = "",
                    RegisterMethod = RegisterMethodEnum.Google,
                    AccountStatus = AccountStatusEnum.Active,
                    SubId = googleUserInfo.Id,
                    RefreshToken = encryptedRefreshToken,
                    UserName = username,
                    IdentityCode = encryptedIdentity,
                    DateOfBirth = DateTime.MinValue,
                    PhoneNumber = $"0{Random.Shared.Next(100000000, 999999999)}",
                    UserType = UserTypeEnum.Customer
                });

                await _repository.AddUserRoleAsync(new UserRoleInfoEntity
                {
                    UserId = userId,
                    RoleId = userRoles.Customer
                });

                await _repository.AddCustomerProfileAsync(new CustomerProfileEntity
                {
                    UserId = userId,
                    TotalPoint = 0,
                    UserSegmentId = user_segments_constant.MemberStandard
                });

                await _unitOfWork.SaveChangesAsync();
                roles = ["Customer"];
            }

            var rolesIds = await _repository.GetUserRoleIdsAsync(userId);
            var permissions = (await _repository.GetUserPermissionsAsync(rolesIds)).ToArray();

            string? jwtKey = _configuration["JWT_Info:Key"];
            string? jwtIss = _configuration["JWT_Info:Iss"];
            string? jwtAud = _configuration["JWT_Info:Aud"];

            if (string.IsNullOrEmpty(jwtKey) || string.IsNullOrEmpty(jwtIss) || string.IsNullOrEmpty(jwtAud))
            {
                _logger.LogError("JWT configuration is missing");
                throw new AppException(Messages.System.Error, 500, "E01");
            }

            var accessToken = _jwtService.GenerateToken(jwtKey, jwtIss, jwtAud, googleUserInfo.Email, username, userId, roles, permissions);
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

    private string GetCallbackUri(string platform)
    {
        return platform.ToLower() switch
        {
            "web" => _configuration["Google:WebCallbackUrl"]
                     ?? "https://renewcinemaprojectfrontend.vercel.app/auth/google-callback",
            "mobile" => _configuration["Google:MobileCallbackUrl"]
                         ?? "https://renewcinemaprojectfrontend.vercel.app/auth/google-callback-mobile",
            _ => throw new AppException(Messages.Platform.InvalidPlatform, 400, "G05")
        };
    }

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
}

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
