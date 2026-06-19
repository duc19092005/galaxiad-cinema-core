using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Application.UseCases.Admin.Transfers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Admin;

[ApiController]
[Authorize(Policy = "Admin")]
[Route("api/v1/admin/transfer-rights")]
[Tags("Admin - Management Transfer")]
[ApiExplorerSettings(GroupName = "v1-admin")]
public class AdminManagementTransferController : ControllerBase
{
    private readonly GetUsersByRoleUseCase _getUsersByRoleUseCase;
    private readonly GetManagedItemsUseCase _getManagedItemsUseCase;
    private readonly TransferManagementUseCase _transferManagementUseCase;

    public AdminManagementTransferController(
        GetUsersByRoleUseCase getUsersByRoleUseCase,
        GetManagedItemsUseCase getManagedItemsUseCase,
        TransferManagementUseCase transferManagementUseCase)
    {
        _getUsersByRoleUseCase = getUsersByRoleUseCase;
        _getManagedItemsUseCase = getManagedItemsUseCase;
        _transferManagementUseCase = transferManagementUseCase;
    }

    /// <summary>
    /// Lấy danh sách người dùng theo Role quản lý
    /// </summary>
    /// <param name="type">1: Facilities, 2: Theater, 3: Movie</param>
    [HttpGet("managers")]
    public async Task<IActionResult> GetManagers([FromQuery] TransferTypeEnum type)
    {
        var result = await _getUsersByRoleUseCase.ExecuteAsync(type);
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách các rạp/phim đang được quản lý.
    /// </summary>
    /// <param name="userId">Id của người quản lý hoặc "unmanaged" để lấy những mục chưa có quản lý</param>
    /// <param name="type">1: Facilities, 2: Theater, 3: Movie</param>
    [HttpGet("managed-items")]
    [HttpGet("managed-items/{userId}")]
    public async Task<IActionResult> GetManagedItems(string? userId, [FromQuery] TransferTypeEnum type)
    {
        var result = await _getManagedItemsUseCase.ExecuteAsync(userId, type);
        return Ok(result);
    }

    /// <summary>
    /// Thực hiện chuyển quyền quản lý từ người A sang người B
    /// </summary>
    [HttpPost("execute")]
    public async Task<IActionResult> TransferRights([FromBody] TransferManagementReqDto request)
    {
        var result = await _transferManagementUseCase.ExecuteAsync(request);
        if (!result.IsSuccess) return BadRequest(result);
        return Ok(result);
    }
}
