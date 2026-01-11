// ReSharper disable All

using BussinessLayer.Dtos.Identity_Access;
using BussinessLayer.Services.Identity_access;
using DataAccess;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers.Identity_access;

[Route("api/v1/[controller]/")]
[ApiController]
public class register_controller : ControllerBase
{
    private readonly dbContext _dbContext;
    
    private readonly register_service register_service;

    public register_controller(dbContext dbContext , register_service service)
    {
        this._dbContext = dbContext;
        this.register_service = service;
    }

    [HttpPost("regular-register")]
    public async Task<IActionResult> regularRegister([FromBody] regular_register_request_dto registerRegularIdentityAccessDto)
    {
        var results = await register_service.regularRegister(registerRegularIdentityAccessDto);
        return Ok(results);
    }
}