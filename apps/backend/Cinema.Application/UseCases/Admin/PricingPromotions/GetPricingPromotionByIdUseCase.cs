using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Application.Interfaces.PricingPromotions;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Admin.PricingPromotions;

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
            throw new NotFoundException(Messages.Promotion.NotFound);
        }

        return PricingPromotionHelper.MapPromotion(promotion);
    }
}

