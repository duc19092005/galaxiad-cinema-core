using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Domain.Entities.Promotions;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.PricingPromotions;

public class DeletePricingPromotionUseCase
{
    private readonly IUnitOfWork _unitOfWork;

    public DeletePricingPromotionUseCase(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task ExecuteAsync(Guid id)
    {
        var promotion = await _unitOfWork.Repository<PricingPromotionEntity>().Query()
            .Include(x => x.Rules)
            .FirstOrDefaultAsync(x => x.PricingPromotionId == id);

        if (promotion == null)
        {
            throw new NotFoundException("Pricing promotion not found.");
        }

        _unitOfWork.Repository<PricingPromotionRuleEntity>().RemoveRange(promotion.Rules);
        _unitOfWork.Repository<PricingPromotionEntity>().Remove(promotion);
        await _unitOfWork.SaveChangesAsync();
    }
}
