// ReSharper disable All

using System.Text.Json;
using System.Web;
using Application.Identity.UseCases;
using ProfileUseCase = Application.Identity.UseCases.UserProfileUseCase;
using BusinessLayer.Dtos;
using Shared.Exceptions;
using Shared.Localization;
using BusinessLayer.Dtos.IdentityAccess.Requests;
using BusinessLayer.Dtos.IdentityAccess.Responses;
using BusinessLayer.Services.IdentityAccess;
using BusinessLayer.UseCases.IdentityAccess;
using DataAccess;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiLayer.Controllers.IdentityAccess;

[Route("api/v1/[controller]/")]
[Tags("Identity Access")]
[ApiController]
public class IdentityAccessController : ControllerBase
{
    private readonly CinemaDbContext _dbContext;
    
    private readonly RegisterService _registerService;
    
    private readonly LoginService _loginService;
    
    private readonly UserProfileService _userProfileService;
    
    private readonly GoogleLoginService _googleLoginService;
    private readonly IConfiguration _configuration;
    private readonly LoginRegularUseCase _loginRegularUseCase;
    private readonly RegisterRegularUseCase _registerRegularUseCase;
    private readonly ProfileUseCase _userProfileUseCase;
    private readonly IUserContextService _userContextService;

    public IdentityAccessController(CinemaDbContext dbContext , RegisterService registerService , LoginService loginService
    , UserProfileService userProfileService, GoogleLoginService googleLoginService, IConfiguration configuration
    , LoginRegularUseCase loginRegularUseCase, RegisterRegularUseCase registerRegularUseCase
    , ProfileUseCase userProfileUseCase, IUserContextService userContextService)
    {
        this._dbContext = dbContext;
        this._registerService = registerService;
        this._loginService = loginService;
        this._userProfileService = userProfileService;
        this._googleLoginService = googleLoginService;
        this._configuration = configuration;
        this._loginRegularUseCase = loginRegularUseCase;
        this._registerRegularUseCase = registerRegularUseCase;
        this._userProfileUseCase = userProfileUseCase;
        this._userContextService = userContextService;
    }

    [HttpPost("regular-register")]
    public async Task<IActionResult> RegularRegister([FromBody] ReqRegularRegisterDto registerRegularIdentityAccessDto)
    {
        var command = new RegisterCommand(
            registerRegularIdentityAccessDto.UserEmail,
            registerRegularIdentityAccessDto.UserPassword,
            registerRegularIdentityAccessDto.UserName,
            registerRegularIdentityAccessDto.IdentityCode,
            registerRegularIdentityAccessDto.PhoneNumber,
            registerRegularIdentityAccessDto.DateOfBirth);

        await _registerRegularUseCase.ExecuteAsync(command);

        return Ok(new BaseResponse<string>
        {
            IsSuccess = true,
            Message = Messages.Auth.RegisterSuccess
        });
    }

    [HttpPost("regular-login")]
    public async Task<IActionResult> RegularLogin([FromBody] ReqRegularLoginDto regularLoginReqDto)
    {
        var result = await _loginRegularUseCase.ExecuteAsync(
            new LoginCommand(regularLoginReqDto.Email, regularLoginReqDto.Password));

        var cookieOptions = new CookieOptions {
            HttpOnly = true, 
            Secure = true, 
            SameSite = SameSiteMode.None,
            Path = "/",
            Expires = DateTime.UtcNow.AddDays(7) 
        };

        Response.Cookies.Append("X-Access-Token", result.AccessToken, cookieOptions);

        return Ok(new BaseResponse<ResRegularLoginDto>
        {
            IsSuccess = true,
            Data = new ResRegularLoginDto
            {
                UserId = result.UserId,
                Username = result.Username,
                Roles = result.Roles
            },
            Message = Messages.Auth.LoginSuccess
        });
    }

    // ================================================================
    //  GOOGLE OAUTH2 ENDPOINTS
    // ================================================================

    /// <summary>
    /// Bước 1: Lấy Google OAuth redirect URL
    /// FE gọi endpoint này, nhận redirectUrl rồi navigate user tới đó
    /// </summary>
    [HttpGet("google-login")]
    public IActionResult GoogleLoginInit([FromQuery] string platform = "web")
    {
        var results = _googleLoginService.InitGoogleLogin(platform);
        return Ok(results);
    }

    /// <summary>
    /// Bước 2a: Google callback cho Web - FE sẽ fetch URL này và BE trả về JSON
    /// </summary>
    [HttpGet("google-callback-web")]
    public async Task<IActionResult> GoogleCallbackWeb([FromQuery] string code, [FromQuery] string state)
    {
        var results = await _googleLoginService.HandleGoogleCallback(code, state);
        
        // Set JWT cookie
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Path = "/",
            Expires = DateTime.UtcNow.AddDays(7)
        };
        Response.Cookies.Append("X-Access-Token", results.Data?.AccessToken ?? "", cookieOptions);

        if (results.Data != null)
        {
            results.Data.AccessToken = null;
        }

        return Ok(results);
    }

    /// <summary>
    /// Bước 2b: Google callback cho Mobile - trả JSON (chưa triển khai redirect app)
    /// </summary>
    [HttpGet("google-callback-mobile")]
    public async Task<IActionResult> GoogleCallbackMobile([FromQuery] string code, [FromQuery] string state)
    {
        var results = await _googleLoginService.HandleGoogleCallback(code, state);
        
        // Mobile: Trả về JSON response (app sẽ handle)
        // Khi có app, có thể redirect bằng deep link scheme
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Path = "/",
            Expires = DateTime.UtcNow.AddDays(7)
        };
        Response.Cookies.Append("X-Access-Token", results.Data?.AccessToken ?? "", cookieOptions);

        if (results.Data != null)
        {
            results.Data.AccessToken = null;
        }

        return Ok(results);
    }

    [HttpPost("Logout")]
    public IActionResult Logout()
    {
        try
        {
            Response.Cookies.Delete("X-Access-Token");
            return Ok(new { Message = "Logged out successfully" });
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception)
        {
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    [Authorize]
    [HttpGet("get-profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = _userContextService.GetUserId();
        var result = await _userProfileUseCase.GetAccessAsync(userId);

        return Ok(new BaseResponse<ResRegularLoginDto>
        {
            IsSuccess = true,
            Data = new ResRegularLoginDto
            {
                UserId = result.UserId,
                Username = result.Username,
                Roles = result.Roles,
                ManagedCinemas = result.ManagedCinemas?
                    .Select(c => new ManagedCinemaInfoDto { CinemaId = c.CinemaId, CinemaName = c.CinemaName })
                    .ToList()
            },
            Message = Messages.Auth.ValidateSuccess
        });
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ReqChangePasswordDto request)
    {
        var userId = _userContextService.GetUserId();
        await _userProfileUseCase.ChangePasswordAsync(
            userId, new ChangePasswordCommand(request.OldPassword!, request.NewPassword!));

        return Ok(new BaseResponse<string>
        {
            IsSuccess = true,
            Message = Messages.Auth.ChangePasswordCompleted
        });
    }

    [Authorize]
    [HttpPut("update-profile")]
    public async Task<IActionResult> UpdateUserProfile(ReqUpdateUserProfileDto request)
    {
        var userId = _userContextService.GetUserId();
        await _userProfileUseCase.UpdateProfileAsync(
            userId,
            new UpdateProfileCommand(request.UserName, request.PhoneNumber, request.IdentityCode, request.DateOfBirth));

        return Ok(new BaseResponse<string>
        {
            IsSuccess = true,
            Message = "Cập nhật thông tin cá nhân thành công."
        });
    }
}
