using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.PricingPromotions;

public class GetPricingPromotionByIdUseCase
{
    private readonly IUnitOfWork _unitOfWork;

    public GetPricingPromotionByIdUseCase(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PricingPromotionDto> ExecuteAsync(Guid id)
    {
        var promotion = await PricingPromotionHelper.QueryPromotions(_unitOfWork)
            .FirstOrDefaultAsync(x => x.PricingPromotionId == id);

        if (promotion == null)
        {
            throw new NotFoundException("Pricing promotion not found.");
        }

        return PricingPromotionHelper.MapPromotion(promotion);
    }
}
