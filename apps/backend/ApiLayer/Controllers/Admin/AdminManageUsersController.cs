using BusinessLayer.Services.Admin.UserManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Enums;

namespace ApiLayer.Controllers.Admin;

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

    [HttpPut("{userId}/portrait")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdateUserPortrait(Guid userId, IFormFile portrait)
    {
        var result = await _adminManageUserService.UpdateUserPortraitAsync(userId, portrait);
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
    public async Task<IActionResult> UpdateUserRole(Guid userId, [FromBody] List<Guid> roleIds)
    {
        var result = await _adminManageUserService.AssignRoleToUserAsync(userId, roleIds);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPost("create-user")]
    public async Task<IActionResult> CreateUser([FromBody] AdminCreateUserRequestDto request)
    {
        var result = await _adminManageUserService.CreateUserAsync(request);
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

    [HttpGet("permissions")]
    public async Task<IActionResult> GetAllPermissions()
    {
        var result = await _adminManageUserService.GetAllPermissionsAsync();
        return Ok(result);
    }

    [HttpGet("roles-permissions")]
    public async Task<IActionResult> GetRolesPermissions()
    {
        var result = await _adminManageUserService.GetRolesPermissionsAsync();
        return Ok(result);
    }

    [HttpPut("roles/{roleId}/permissions")]
    public async Task<IActionResult> UpdateRolePermissions(Guid roleId, [FromBody] List<Guid> permissionIds)
    {
        var result = await _adminManageUserService.UpdateRolePermissionsAsync(roleId, permissionIds);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
}
