using BussinessLayer.Dtos.Identity_Access;
using DataAccess;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers.Identity_access;

[Route("api/[controller]")]
[ApiController]
public class register_controller : ControllerBase
{
    private readonly dbContext _dbContext;

    public register_controller(dbContext dbContext)
    {
        this._dbContext = dbContext;
    }

    [HttpPost("regular-register")]
    public IActionResult regularRegister([FromBody] regular_register_request_dto registerRegularIdentityAccessDto)
    {
        return Ok(registerRegularIdentityAccessDto);
    }
}