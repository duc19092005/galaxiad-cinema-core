// ReSharper disable All

using Shared.Exceptions;
using BusinessLayer.Dtos.IdentityAccess;
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
    

    public IdentityAccessController(CinemaDbContext dbContext , RegisterService registerService , LoginService loginService
    , UserProfileService userProfileService)
    {
        this._dbContext = dbContext;
        this._registerService = registerService;
        this._loginService = loginService;
        this._userProfileService = userProfileService;
    }

    [HttpPost("regular-register")]
    public async Task<IActionResult> RegularRegister([FromBody] ResRegularRegisterDto registerRegularIdentityAccessDto)
    {
        var results = await _registerService.Register(registerRegularIdentityAccessDto);
        return Ok(results);
    }

    [HttpPost("regular-login")]
    public async Task<IActionResult> RegularLogin([FromBody] ReqRegularLoginDto regularLoginReqDto)
    {
        var results = await _loginService.Login(regularLoginReqDto);
        
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true, 
            Secure = false,      
            SameSite = SameSiteMode.Strict, 
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
}
