using BusinessLayer.Dtos.PricingPromotions;
using BusinessLayer.Services.PricingPromotions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiLayer.Controllers.Admin;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/v1/admin/pricing-promotions")]
[Tags("Admin - Pricing Promotions")]
[ApiExplorerSettings(GroupName = "v1-admin")]
public class AdminPricingPromotionsController : ControllerBase
{
    private readonly PricingPromotionService _pricingPromotionService;

    public AdminPricingPromotionsController(PricingPromotionService pricingPromotionService)
    {
        _pricingPromotionService = pricingPromotionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _pricingPromotionService.GetAllAsync());
    }

    [HttpGet("options")]
    public async Task<IActionResult> GetOptions()
    {
        return Ok(await _pricingPromotionService.GetOptionsAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        return Ok(await _pricingPromotionService.GetByIdAsync(id));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PricingPromotionUpsertDto dto)
    {
        var result = await _pricingPromotionService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.PricingPromotionId }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] PricingPromotionUpsertDto dto)
    {
        return Ok(await _pricingPromotionService.UpdateAsync(id, dto));
    }

    [HttpPatch("{id:guid}/toggle")]
    public async Task<IActionResult> Toggle(Guid id)
    {
        return Ok(await _pricingPromotionService.ToggleAsync(id));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _pricingPromotionService.DeleteAsync(id);
        return NoContent();
    }
}
