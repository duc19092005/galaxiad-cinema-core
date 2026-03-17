using BusinessLayer.Services.Admin.UserManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Enums;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Admin.Responses;
using DataAccess;
using DataAccess.Constants;
using Microsoft.EntityFrameworkCore;

namespace ApiLayer.Controllers.admin;

[ApiController]
[Authorize(Policy = "Admin")]
[Route("api/v1/[controller]")]
[ApiExplorerSettings(GroupName = "v1-admin")]
public class AdminManageUsersController : ControllerBase
{
    private readonly AdminManageUserService _adminManageUserService;

    private readonly CinemaDbContext _cinemaDbContext;

    public AdminManageUsersController(AdminManageUserService adminManageUserService ,
        CinemaDbContext cinemaDbContext)
    {
        _adminManageUserService = adminManageUserService;
        _cinemaDbContext = cinemaDbContext;
    }
    
    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        var result = await _adminManageUserService.GetAllUsersAsync();
        return Ok(result);
    }

    [HttpPut("{userId}/status")]
    public async Task<IActionResult> UpdateUserStatus(Guid userId, [FromQuery] AccountStatusEnum status)
    {
        var result = await _adminManageUserService.SetUserStatusAsync(userId, status);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
    
    [HttpGet("{userId}/role")]
    public async Task<IActionResult> GetUserRole(Guid userId)
    {
        var result = await _cinemaDbContext.UserRoleInfoEntity.AsNoTracking().Where(x => x.UserId.Equals(userId))
            .Select(x => x.RoleListInfoEntity.RoleName).ToListAsync();
        return Ok(result);
    }
    
    [HttpPut("{userId}/role")]
    public async Task<IActionResult> UpdateUserRole(Guid userId, List<Guid> roleIds)
    {
        var result = await _adminManageUserService.AssignRoleToUserAsync(userId, roleIds);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
    
    [HttpPut("cinemas/{cinemaId}/manager")]
    public async Task<IActionResult> AssignCinemaManager(Guid cinemaId, [FromQuery] Guid managerId)
    {
        var result = await _adminManageUserService.AssignCinemaToManagerAsync(cinemaId, managerId);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetAllRoles()
    {
        var getAllRoles = await _cinemaDbContext.RoleListInfoEntity.AsNoTracking().Where(x => 
            x.RoleId != userRoles.Admin && x.RoleId != userRoles.Customer).Select(x => new ResponseRolesDto()
        {
            RoleId = x.RoleId,
            RoleName = x.RoleName,
        }).ToListAsync();
        
        return Ok(getAllRoles);
    }
}
