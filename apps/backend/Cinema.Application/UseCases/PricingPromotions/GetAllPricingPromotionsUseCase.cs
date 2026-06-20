using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Application.Interfaces.PricingPromotions;

namespace Cinema.Application.UseCases.PricingPromotions;

public class GetAllPricingPromotionsUseCase
{
    private readonly IPricingPromotionRepository _repository;

    public GetAllPricingPromotionsUseCase(IPricingPromotionRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<PricingPromotionDto>> ExecuteAsync()
    {
        var promotions = await _repository.GetAllPromotionsAsync();
        return promotions.Select(PricingPromotionHelper.MapPromotion).ToList();
    }
}
