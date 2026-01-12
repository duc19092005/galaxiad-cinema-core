// ReSharper disable All

using Backend.Shard.Exceptions;
using BussinessLayer.Dtos.Identity_Access;
using BussinessLayer.Services.Identity_access;
using DataAccess;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers.Identity_access;

[Route("api/v1/[controller]/")]
[ApiController]
public class identity_access_controller : ControllerBase
{
    private readonly dbContext _dbContext;
    
    private readonly register_service register_service;
    
    private readonly login_service login_service;

    public identity_access_controller(dbContext dbContext , register_service service , login_service login_service)
    {
        this._dbContext = dbContext;
        this.register_service = service;
        this.login_service = login_service;
    }

    [HttpPost("regular-register")]
    public async Task<IActionResult> regularRegister([FromBody] regular_register_request_dto registerRegularIdentityAccessDto)
    {
        var results = await register_service.regularRegister(registerRegularIdentityAccessDto);
        return Ok(results);
    }

    [HttpPost("regular-login")]
    public async Task<IActionResult> regularLogin([FromBody] regular_login_req_dto regularLoginReqDto)
    {
        var results = await login_service.regularLogin(regularLoginReqDto);
        
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true, 
            Secure = false,      
            SameSite = SameSiteMode.Strict, 
            Expires = DateTime.UtcNow.AddDays(7) 
        };

        Response.Cookies.Append("X-Access-Token", results.data?.access_token , cookieOptions);

        results.data.access_token = null;
        
        return Ok(results);
    }

    [HttpPost("Logout")]
    public IActionResult Logout()
    {
        try
        {
            Response.Cookies.Delete("X-Access-Token");
            return Ok(new { message = "Logged out successfully" });
        }
        catch (app_exception)
        {
            throw;
        }
        catch (Exception e)
        {
            throw system_exception.system_exception_caller();
        }
    }
}