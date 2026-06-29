using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Admin;
using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Application.UseCases.Admin.UserManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Cinema.Domain.Enums;

namespace Cinema.Api.Controllers.Admin;

[ApiController]
[Authorize(Policy = "Admin")]
[Route("api/v1/[controller]")]
[ApiExplorerSettings(GroupName = "v1-admin")]
public class AdminManageUsersController : ControllerBase
{
    private readonly GetAllUsersUseCase _getAllUsersUseCase;
    private readonly SetUserStatusUseCase _setUserStatusUseCase;
    private readonly UpdateUserPortraitUseCase _updateUserPortraitUseCase;
    private readonly GetUserRolesUseCase _getUserRolesUseCase;
    private readonly AssignRoleToUserUseCase _assignRoleToUserUseCase;
    private readonly CreateUserUseCase _createUserUseCase;
    private readonly AssignCinemaToManagerUseCase _assignCinemaToManagerUseCase;
    private readonly GetAssignableRolesUseCase _getAssignableRolesUseCase;
    private readonly GetAllPermissionsUseCase _getAllPermissionsUseCase;
    private readonly GetRolesPermissionsUseCase _getRolesPermissionsUseCase;
    private readonly UpdateRolePermissionsUseCase _updateRolePermissionsUseCase;
    private readonly AdminUpdateUserProfileUseCase _adminUpdateUserProfileUseCase;

    public AdminManageUsersController(
        GetAllUsersUseCase getAllUsersUseCase,
        SetUserStatusUseCase setUserStatusUseCase,
        UpdateUserPortraitUseCase updateUserPortraitUseCase,
        GetUserRolesUseCase getUserRolesUseCase,
        AssignRoleToUserUseCase assignRoleToUserUseCase,
        CreateUserUseCase createUserUseCase,
        AssignCinemaToManagerUseCase assignCinemaToManagerUseCase,
        GetAssignableRolesUseCase getAssignableRolesUseCase,
        GetAllPermissionsUseCase getAllPermissionsUseCase,
        GetRolesPermissionsUseCase getRolesPermissionsUseCase,
        UpdateRolePermissionsUseCase updateRolePermissionsUseCase,
        AdminUpdateUserProfileUseCase adminUpdateUserProfileUseCase)
    {
        _getAllUsersUseCase = getAllUsersUseCase;
        _setUserStatusUseCase = setUserStatusUseCase;
        _updateUserPortraitUseCase = updateUserPortraitUseCase;
        _getUserRolesUseCase = getUserRolesUseCase;
        _assignRoleToUserUseCase = assignRoleToUserUseCase;
        _createUserUseCase = createUserUseCase;
        _assignCinemaToManagerUseCase = assignCinemaToManagerUseCase;
        _getAssignableRolesUseCase = getAssignableRolesUseCase;
        _getAllPermissionsUseCase = getAllPermissionsUseCase;
        _getRolesPermissionsUseCase = getRolesPermissionsUseCase;
        _updateRolePermissionsUseCase = updateRolePermissionsUseCase;
        _adminUpdateUserProfileUseCase = adminUpdateUserProfileUseCase;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        var result = await _getAllUsersUseCase.ExecuteAsync();
        return Ok(result);
    }

    [HttpPut("{userId}/profile")]
    public async Task<IActionResult> UpdateUserProfile(Guid userId, [FromBody] AdminUpdateUserProfileDto dto)
    {
        var result = await _adminUpdateUserProfileUseCase.ExecuteAsync(userId, dto);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{userId}/status")]
    public async Task<IActionResult> UpdateUserStatus(Guid userId, [FromQuery] AccountStatusEnum status)
    {
        var result = await _setUserStatusUseCase.ExecuteAsync(userId, status);
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
        var result = await _updateUserPortraitUseCase.ExecuteAsync(userId, portrait);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpGet("{userId}/role")]
    public async Task<IActionResult> GetUserRole(Guid userId)
    {
        var result = await _getUserRolesUseCase.ExecuteAsync(userId);
        return Ok(result);
    }

    [HttpPut("{userId}/role")]
    public async Task<IActionResult> UpdateUserRole(Guid userId, [FromBody] UpdateUserRoleRequestDto request)
    {
        var result = await _assignRoleToUserUseCase.ExecuteAsync(userId, request);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPost("create-user")]
    public async Task<IActionResult> CreateUser([FromBody] AdminCreateUserRequestDto request)
    {
        var result = await _createUserUseCase.ExecuteAsync(request);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPut("cinemas/{cinemaId}/manager")]
    public async Task<IActionResult> AssignCinemaManager(Guid cinemaId, [FromQuery] Guid managerId)
    {
        var result = await _assignCinemaToManagerUseCase.ExecuteAsync(cinemaId, managerId);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetAllRoles()
    {
        var getAllRoles = await _getAssignableRolesUseCase.ExecuteAsync();
        return Ok(getAllRoles);
    }

    [HttpGet("permissions")]
    public async Task<IActionResult> GetAllPermissions()
    {
        var result = await _getAllPermissionsUseCase.ExecuteAsync();
        return Ok(result);
    }

    [HttpGet("roles-permissions")]
    public async Task<IActionResult> GetRolesPermissions()
    {
        var result = await _getRolesPermissionsUseCase.ExecuteAsync();
        return Ok(result);
    }

    [HttpPut("roles/{roleId}/permissions")]
    public async Task<IActionResult> UpdateRolePermissions(Guid roleId, [FromBody] List<Guid> permissionIds)
    {
        var result = await _updateRolePermissionsUseCase.ExecuteAsync(roleId, permissionIds);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
}
