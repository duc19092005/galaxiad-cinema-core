using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Application.Interfaces.PricingPromotions;

namespace Cinema.Application.UseCases.PricingPromotions;

public class GetActivePublicPricingPromotionsUseCase
{
    private readonly IPricingPromotionRepository _repository;

    public GetActivePublicPricingPromotionsUseCase(IPricingPromotionRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<PricingPromotionDto>> ExecuteAsync()
    {
        var promotions = await _repository.GetActivePublicPromotionsAsync();
        return promotions.Select(PricingPromotionHelper.MapPromotion).ToList();
    }
}
