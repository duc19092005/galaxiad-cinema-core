using BusinessLayer.Services.Admin.UserManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Enums;

namespace ApiLayer.Controllers.admin;

[ApiController]
[Authorize(Policy = "Admin")]
[Route("api/v1/[controller]")]
[ApiExplorerSettings(GroupName = "v1-admin")]
public class AdminManageUsersController : ControllerBase
{
    private readonly AdminManageUserService _adminManageUserService;

    public AdminManageUsersController(AdminManageUserService adminManageUserService)
    {
        _adminManageUserService = adminManageUserService;
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
        var result = await _adminManageUserService.GetUserRolesAsync(userId);
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
        var getAllRoles = await _adminManageUserService.GetAssignableRolesAsync();
        
        return Ok(getAllRoles);
    }
}
