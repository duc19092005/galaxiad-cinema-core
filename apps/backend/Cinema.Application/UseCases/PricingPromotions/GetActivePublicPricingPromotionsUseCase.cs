using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.PricingPromotions;

public class GetActivePublicPricingPromotionsUseCase
{
    private readonly IUnitOfWork _unitOfWork;

    public GetActivePublicPricingPromotionsUseCase(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<PricingPromotionDto>> ExecuteAsync()
    {
        var now = DateTime.UtcNow;
        var promotions = await PricingPromotionHelper.QueryPromotions(_unitOfWork)
            .Where(x => x.IsActive
                        && (!x.StartDate.HasValue || x.StartDate <= now)
                        && (!x.EndDate.HasValue || x.EndDate >= now)
                        && x.Rules.Any(r => r.IsActive && r.PromotionType != PromotionTypeEnum.Surcharge))
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync();

        return promotions.Select(PricingPromotionHelper.MapPromotion).ToList();
    }
}
