using System;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.PricingPromotions;
using Cinema.Application.Exceptions;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.PricingPromotions;

public class DeletePricingPromotionUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPricingPromotionRepository _repository;

    public DeletePricingPromotionUseCase(IPricingPromotionRepository repository,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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
        await _unitOfWork.SaveChangesAsync();
    }
}
