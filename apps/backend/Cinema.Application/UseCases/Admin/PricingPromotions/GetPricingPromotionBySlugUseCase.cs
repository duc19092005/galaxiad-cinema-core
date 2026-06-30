using System.Threading.Tasks;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Application.Interfaces.PricingPromotions;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Admin.PricingPromotions;

public class GetPricingPromotionBySlugUseCase
{
    private readonly IPricingPromotionRepository _repository;

    public GetPricingPromotionBySlugUseCase(IPricingPromotionRepository repository)
    {
        _repository = repository;
    }

    public async Task<PricingPromotionDto> ExecuteAsync(string slug)
    {
        var promotion = await _repository.GetActivePromotionBySlugAsync(slug);

        if (promotion == null)
        {
            throw new NotFoundException(Messages.Promotion.NotFound);
        }

        return PricingPromotionHelper.MapPromotion(promotion);
    }
}

