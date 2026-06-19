using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Domain.Entities.Promotions;
using Cinema.Application.Interfaces;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.PricingPromotions;

public class TogglePricingPromotionUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserContextService _userContextService;
    private readonly GetPricingPromotionByIdUseCase _getPricingPromotionByIdUseCase;

    public TogglePricingPromotionUseCase(
        IUnitOfWork unitOfWork,
        IUserContextService userContextService,
        GetPricingPromotionByIdUseCase getPricingPromotionByIdUseCase)
    {
        _unitOfWork = unitOfWork;
        _userContextService = userContextService;
        _getPricingPromotionByIdUseCase = getPricingPromotionByIdUseCase;
    }

    public async Task<PricingPromotionDto> ExecuteAsync(Guid id)
    {
        var promotion = await _unitOfWork.Repository<PricingPromotionEntity>().Query()
            .FirstOrDefaultAsync(x => x.PricingPromotionId == id);

        if (promotion == null)
        {
            throw new NotFoundException("Pricing promotion not found.");
        }

        promotion.IsActive = !promotion.IsActive;
        promotion.UpdatedAt = DateTime.UtcNow;
        promotion.UpdatedBy = TryGetUserId();
        _unitOfWork.Repository<PricingPromotionEntity>().Update(promotion);
        await _unitOfWork.SaveChangesAsync();
        return await _getPricingPromotionByIdUseCase.ExecuteAsync(id);
    }

    private Guid? TryGetUserId()
    {
        try
        {
            return _userContextService.GetUserId();
        }
        catch
        {
            return null;
        }
    }
}
