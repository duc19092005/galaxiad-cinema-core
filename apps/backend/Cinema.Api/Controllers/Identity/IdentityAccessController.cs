using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.IdentityAccess.Requests;
using Cinema.Application.Dtos.IdentityAccess.Responses;
using Cinema.Application.UseCases.IdentityAccess;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Cinema.Application.Exceptions;

namespace Cinema.Api.Controllers.Identity;

[Route("api/v1/[controller]/")]
[Tags("Identity Access")]
[ApiController]
public class IdentityAccessController : ControllerBase
{
    private readonly IdentityAccessRegularRegisterUseCase _registerUseCase;
    private readonly identityAccessRegularLoginUseCase _loginUseCase;
    private readonly GoogleLoginInitUseCase _googleLoginInitUseCase;
    private readonly GoogleLoginCallbackUseCase _googleLoginCallbackUseCase;
    private readonly GetProfileUseCase _getProfileUseCase;
    private readonly ChangePasswordUseCase _changePasswordUseCase;
    private readonly UpdateUserProfileUseCase _updateUserProfileUseCase;

    public IdentityAccessController(
        IdentityAccessRegularRegisterUseCase registerUseCase,
        identityAccessRegularLoginUseCase loginUseCase,
        GoogleLoginInitUseCase googleLoginInitUseCase,
        GoogleLoginCallbackUseCase googleLoginCallbackUseCase,
        GetProfileUseCase getProfileUseCase,
        ChangePasswordUseCase changePasswordUseCase,
        UpdateUserProfileUseCase updateUserProfileUseCase)
    {
        _registerUseCase = registerUseCase;
        _loginUseCase = loginUseCase;
        _googleLoginInitUseCase = googleLoginInitUseCase;
        _googleLoginCallbackUseCase = googleLoginCallbackUseCase;
        _getProfileUseCase = getProfileUseCase;
        _changePasswordUseCase = changePasswordUseCase;
        _updateUserProfileUseCase = updateUserProfileUseCase;
    }

    [HttpPost("regular-register")]
    public async Task<IActionResult> RegularRegister([FromBody] ReqRegularRegisterDto registerRegularIdentityAccessDto)
    {
        var results = await _registerUseCase.Add(registerRegularIdentityAccessDto);
        return Ok(results);
    }

    [HttpPost("regular-login")]
    public async Task<IActionResult> RegularLogin([FromBody] ReqRegularLoginDto regularLoginReqDto)
    {
        var results = await _loginUseCase.Login(regularLoginReqDto);
        
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

    [HttpGet("google-login")]
    public IActionResult GoogleLoginInit([FromQuery] string platform = "web")
    {
        var results = _googleLoginInitUseCase.Execute(platform);
        return Ok(results);
    }

    [HttpGet("google-callback-web")]
    public async Task<IActionResult> GoogleCallbackWeb([FromQuery] string code, [FromQuery] string state)
    {
        var results = await _googleLoginCallbackUseCase.ExecuteAsync(code, state);
        
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

    [HttpGet("google-callback-mobile")]
    public async Task<IActionResult> GoogleCallbackMobile([FromQuery] string code, [FromQuery] string state)
    {
        var results = await _googleLoginCallbackUseCase.ExecuteAsync(code, state);
        
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
        var results = await _getProfileUseCase.ExecuteAsync();
        return Ok(results);
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ReqChangePasswordDto request)
    {
        var results = await _changePasswordUseCase.ExecuteAsync(request);
        return Ok(results);
    }

    [Authorize]
    [HttpPut("update-profile")]
    public async Task<IActionResult> UpdateUserProfile(ReqUpdateUserProfileDto request)
    {
        var results = await _updateUserProfileUseCase.ExecuteAsync(request);
        return Ok(results);
    }
}
