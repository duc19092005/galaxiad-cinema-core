using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Application.Interfaces.PricingPromotions;
using Cinema.Application.Exceptions;

namespace Cinema.Application.UseCases.PricingPromotions;

public class GetPricingPromotionByIdUseCase
{
    private readonly IPricingPromotionRepository _repository;

    public GetPricingPromotionByIdUseCase(IPricingPromotionRepository repository)
    {
        _repository = repository;
    }

    public async Task<PricingPromotionDto> ExecuteAsync(Guid id)
    {
        var promotion = await _repository.GetPromotionByIdAsync(id);

        if (promotion == null)
        {
            throw new NotFoundException("Pricing promotion not found.");
        }

        return PricingPromotionHelper.MapPromotion(promotion);
    }
}
