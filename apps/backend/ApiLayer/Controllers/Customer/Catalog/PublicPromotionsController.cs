using BusinessLayer.Services.PricingPromotions;
using Microsoft.AspNetCore.Mvc;

namespace ApiLayer.Controllers.Customer.Catalog;

[ApiController]
[Route("api/v1/promotions")]
[Tags("Public - Promotions")]
[ApiExplorerSettings(GroupName = "v1-user")]
public class PublicPromotionsController : ControllerBase
{
    private readonly PricingPromotionService _pricingPromotionService;

    public PublicPromotionsController(PricingPromotionService pricingPromotionService)
    {
        _pricingPromotionService = pricingPromotionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetActive()
    {
        return Ok(await _pricingPromotionService.GetActivePublicAsync());
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        return Ok(await _pricingPromotionService.GetBySlugAsync(slug));
    }
}
