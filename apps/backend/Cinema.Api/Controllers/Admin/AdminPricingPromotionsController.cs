using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Application.UseCases.Admin.PricingPromotions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Admin;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/v1/admin/pricing-promotions")]
[Tags("Admin - Pricing Promotions")]
[ApiExplorerSettings(GroupName = "v1-admin")]
public class AdminPricingPromotionsController : ControllerBase
{
    private readonly GetAllPricingPromotionsUseCase _getAllPricingPromotionsUseCase;
    private readonly GetPricingPromotionOptionsUseCase _getPricingPromotionOptionsUseCase;
    private readonly GetPricingPromotionByIdUseCase _getPricingPromotionByIdUseCase;
    private readonly CreatePricingPromotionUseCase _createPricingPromotionUseCase;
    private readonly UpdatePricingPromotionUseCase _updatePricingPromotionUseCase;
    private readonly TogglePricingPromotionUseCase _togglePricingPromotionUseCase;
    private readonly DeletePricingPromotionUseCase _deletePricingPromotionUseCase;

    public AdminPricingPromotionsController(
        GetAllPricingPromotionsUseCase getAllPricingPromotionsUseCase,
        GetPricingPromotionOptionsUseCase getPricingPromotionOptionsUseCase,
        GetPricingPromotionByIdUseCase getPricingPromotionByIdUseCase,
        CreatePricingPromotionUseCase createPricingPromotionUseCase,
        UpdatePricingPromotionUseCase updatePricingPromotionUseCase,
        TogglePricingPromotionUseCase togglePricingPromotionUseCase,
        DeletePricingPromotionUseCase deletePricingPromotionUseCase)
    {
        _getAllPricingPromotionsUseCase = getAllPricingPromotionsUseCase;
        _getPricingPromotionOptionsUseCase = getPricingPromotionOptionsUseCase;
        _getPricingPromotionByIdUseCase = getPricingPromotionByIdUseCase;
        _createPricingPromotionUseCase = createPricingPromotionUseCase;
        _updatePricingPromotionUseCase = updatePricingPromotionUseCase;
        _togglePricingPromotionUseCase = togglePricingPromotionUseCase;
        _deletePricingPromotionUseCase = deletePricingPromotionUseCase;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _getAllPricingPromotionsUseCase.ExecuteAsync());
    }

    [HttpGet("options")]
    public async Task<IActionResult> GetOptions()
    {
        return Ok(await _getPricingPromotionOptionsUseCase.ExecuteAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        return Ok(await _getPricingPromotionByIdUseCase.ExecuteAsync(id));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PricingPromotionUpsertDto dto)
    {
        var result = await _createPricingPromotionUseCase.ExecuteAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.PricingPromotionId }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] PricingPromotionUpsertDto dto)
    {
        return Ok(await _updatePricingPromotionUseCase.ExecuteAsync(id, dto));
    }

    [HttpPatch("{id:guid}/toggle")]
    public async Task<IActionResult> Toggle(Guid id)
    {
        return Ok(await _togglePricingPromotionUseCase.ExecuteAsync(id));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _deletePricingPromotionUseCase.ExecuteAsync(id);
        return NoContent();
    }
}
