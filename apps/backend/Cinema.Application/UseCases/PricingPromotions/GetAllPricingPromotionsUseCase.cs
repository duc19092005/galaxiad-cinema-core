using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.PricingPromotions;

public class GetAllPricingPromotionsUseCase
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAllPricingPromotionsUseCase(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<PricingPromotionDto>> ExecuteAsync()
    {
        var promotions = await PricingPromotionHelper.QueryPromotions(_unitOfWork)
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync();

        return promotions.Select(PricingPromotionHelper.MapPromotion).ToList();
    }
}
