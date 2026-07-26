using Cinema.Application.Dtos.Concessions;
using Cinema.Application.UseCases.Concessions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Management.Concessions;

/// <summary>Quản lý danh mục sản phẩm F&amp;B và combo chuẩn toàn hệ thống — dành cho Admin.</summary>
[ApiController]
[Authorize(Policy = "Admin")]
[Route("api/Admin/Concessions")]
[Route("api/v1/Admin/Concessions")]
[Tags("Admin - Concession Catalog")]
[ApiExplorerSettings(GroupName = "v1-admin")]
public class AdminConcessionCatalogController : ControllerBase
{
    private readonly CreateConcessionProductUseCase _createConcessionProductUseCase;
    private readonly CreateComboUseCase _createComboUseCase;
    private readonly UpdateConcessionProductUseCase _updateConcessionProductUseCase;
    private readonly ToggleConcessionProductStatusUseCase _toggleConcessionProductStatusUseCase;

    public AdminConcessionCatalogController(
        CreateConcessionProductUseCase createConcessionProductUseCase,
        CreateComboUseCase createComboUseCase,
        UpdateConcessionProductUseCase updateConcessionProductUseCase,
        ToggleConcessionProductStatusUseCase toggleConcessionProductStatusUseCase)
    {
        _createConcessionProductUseCase = createConcessionProductUseCase;
        _createComboUseCase = createComboUseCase;
        _updateConcessionProductUseCase = updateConcessionProductUseCase;
        _toggleConcessionProductStatusUseCase = toggleConcessionProductStatusUseCase;
    }

    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] ReqCreateConcessionProductDto dto)
        => Ok(await _createConcessionProductUseCase.ExecuteAsync(dto));

    [HttpPost("combos")]
    public async Task<IActionResult> CreateCombo([FromBody] ReqCreateComboDto dto)
        => Ok(await _createComboUseCase.ExecuteAsync(dto));

    [HttpPut("products/{productId:guid}")]
    public async Task<IActionResult> UpdateProduct(Guid productId, [FromBody] ReqUpdateConcessionProductDto dto)
        => Ok(await _updateConcessionProductUseCase.ExecuteAsync(productId, dto));

    [HttpPatch("products/{productId:guid}/status")]
    public async Task<IActionResult> ToggleStatus(Guid productId, [FromQuery] bool isActive)
        => Ok(await _toggleConcessionProductStatusUseCase.ExecuteAsync(productId, isActive));
}
