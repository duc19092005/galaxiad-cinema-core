using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Domain.Enums;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.PricingPromotions;

public class GetPricingPromotionBySlugUseCase
{
    private readonly IUnitOfWork _unitOfWork;

    public GetPricingPromotionBySlugUseCase(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PricingPromotionDto> ExecuteAsync(string slug)
    {
        var now = DateTime.UtcNow;
        var promotion = await PricingPromotionHelper.QueryPromotions(_unitOfWork)
            .FirstOrDefaultAsync(x => x.Slug == slug
                                      && x.IsActive
                                      && (!x.StartDate.HasValue || x.StartDate <= now)
                                      && (!x.EndDate.HasValue || x.EndDate >= now)
                                      && x.Rules.Any(r => r.IsActive && r.PromotionType != PromotionTypeEnum.Surcharge));

        if (promotion == null)
        {
            throw new NotFoundException("Pricing promotion not found.");
        }

        return PricingPromotionHelper.MapPromotion(promotion);
    }
}
