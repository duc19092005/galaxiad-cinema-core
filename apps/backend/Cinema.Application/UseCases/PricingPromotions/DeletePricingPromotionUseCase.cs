using System;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.PricingPromotions;
using Cinema.Domain.Exceptions;

namespace Cinema.Application.UseCases.PricingPromotions;

public class DeletePricingPromotionUseCase
{
    private readonly IPricingPromotionRepository _repository;

    public DeletePricingPromotionUseCase(IPricingPromotionRepository repository)
    {
        _repository = repository;
    }

    public async Task ExecuteAsync(Guid id)
    {
        var promotion = await _repository.GetPromotionByIdAsync(id);

        if (promotion == null)
        {
            throw new NotFoundException("Pricing promotion not found.");
        }

        _repository.RemovePromotionRulesRange(promotion.Rules);
        _repository.RemovePromotion(promotion);
        await _repository.SaveChangesAsync();
    }
}
