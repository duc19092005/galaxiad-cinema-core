using System.Threading.Tasks;
using Cinema.Application.UseCases.PricingPromotions;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Customer.Catalog;

[ApiController]
[Route("api/v1/promotions")]
[Tags("Public - Promotions")]
[ApiExplorerSettings(GroupName = "v1-user")]
public class PublicPromotionsController : ControllerBase
{
    private readonly GetActivePublicPricingPromotionsUseCase _getActivePublicPricingPromotionsUseCase;
    private readonly GetPricingPromotionBySlugUseCase _getPricingPromotionBySlugUseCase;

    public PublicPromotionsController(
        GetActivePublicPricingPromotionsUseCase getActivePublicPricingPromotionsUseCase,
        GetPricingPromotionBySlugUseCase getPricingPromotionBySlugUseCase)
    {
        _getActivePublicPricingPromotionsUseCase = getActivePublicPricingPromotionsUseCase;
        _getPricingPromotionBySlugUseCase = getPricingPromotionBySlugUseCase;
    }

    [HttpGet]
    public async Task<IActionResult> GetActive()
    {
        return Ok(await _getActivePublicPricingPromotionsUseCase.ExecuteAsync());
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        return Ok(await _getPricingPromotionBySlugUseCase.ExecuteAsync(slug));
    }
}
