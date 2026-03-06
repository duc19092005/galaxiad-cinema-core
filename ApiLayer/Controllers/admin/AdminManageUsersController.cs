using BusinessLayer.Services.Admin.UserManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Enums;
using BusinessLayer.Dtos;

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

    /// <summary>
    /// Lấy danh sách toàn bộ người dùng 
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        var result = await _adminManageUserService.GetAllUsersAsync();
        return Ok(result);
    }

    /// <summary>
    /// Cập nhật trạng thái người dùng (Ban, Lock, Unban...)
    /// </summary>
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

    /// <summary>
    /// Thay đổi Role người dùng
    /// </summary>
    [HttpPut("{userId}/role")]
    public async Task<IActionResult> UpdateUserRole(Guid userId, [FromQuery] string roleName)
    {
        var result = await _adminManageUserService.AssignRoleToUserAsync(userId, roleName);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Giao rạp chiếu cho 1 TheaterManager quản lý
    /// </summary>
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
}
