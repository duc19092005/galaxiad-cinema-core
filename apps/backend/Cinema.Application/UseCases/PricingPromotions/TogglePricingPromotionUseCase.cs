using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.PricingPromotions;
using Cinema.Application.Exceptions;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.PricingPromotions;

public class TogglePricingPromotionUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPricingPromotionRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly GetPricingPromotionByIdUseCase _getPricingPromotionByIdUseCase;

    public TogglePricingPromotionUseCase(
        IPricingPromotionRepository repository,
        IUserContextService userContextService,
        GetPricingPromotionByIdUseCase getPricingPromotionByIdUseCase,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _userContextService = userContextService;
        _getPricingPromotionByIdUseCase = getPricingPromotionByIdUseCase;
    }

    public async Task<PricingPromotionDto> ExecuteAsync(Guid id)
    {
        var promotion = await _repository.GetPromotionByIdAsync(id);

        if (promotion == null)
        {
            throw new NotFoundException("Pricing promotion not found.");
        }

        promotion.IsActive = !promotion.IsActive;
        promotion.UpdatedAt = DateTime.UtcNow;
        promotion.UpdatedBy = TryGetUserId();
        _repository.UpdatePromotion(promotion);
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
