// ReSharper disable All

using System.Text.Json;
using System.Web;
using Shared.Exceptions;
using BusinessLayer.Dtos.IdentityAccess.Requests;
using BusinessLayer.Dtos.IdentityAccess.Responses;
using BusinessLayer.Services.IdentityAccess;
using BusinessLayer.UseCases.IdentityAccess;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiLayer.Controllers.IdentityAccess;

[Route("api/v1/[controller]/")]
[Tags("Identity Access")]
[ApiController]
public class IdentityAccessController : ControllerBase
{
    private readonly RegisterService _registerService;
    
    private readonly LoginService _loginService;
    
    private readonly UserProfileService _userProfileService;
    
    private readonly GoogleLoginService _googleLoginService;
    private readonly IConfiguration _configuration;

    public IdentityAccessController(RegisterService registerService , LoginService loginService
    , UserProfileService userProfileService, GoogleLoginService googleLoginService, IConfiguration configuration)
    {
        this._registerService = registerService;
        this._loginService = loginService;
        this._userProfileService = userProfileService;
        this._googleLoginService = googleLoginService;
        this._configuration = configuration;
    }

    [HttpPost("regular-register")]
    public async Task<IActionResult> RegularRegister([FromBody] ReqRegularRegisterDto registerRegularIdentityAccessDto)
    {
        var results = await _registerService.Register(registerRegularIdentityAccessDto);
        return Ok(results);
    }

    [HttpPost("regular-login")]
    public async Task<IActionResult> RegularLogin([FromBody] ReqRegularLoginDto regularLoginReqDto)
    {
        var results = await _loginService.Login(regularLoginReqDto);
        
        var cookieOptions = new CookieOptions {
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
        catch (Exception e)
        {
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    [Authorize]
    [HttpGet("get-profile")]
    public async Task<IActionResult> GetProfile()
    {
        var results = await _userProfileService.GetAccess();
        return Ok(results);
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ReqChangePasswordDto request)
    {
        var results = await _userProfileService.ChangePassword(request);
        return Ok(results);
    }

    [Authorize]
    [HttpPut("update-profile")]
    public async Task<IActionResult> UpdateUserProfile(ReqUpdateUserProfileDto request)
    {
        var results = await _userProfileService.UpdateUserProfile(request);
        return Ok(results);
    }
}
