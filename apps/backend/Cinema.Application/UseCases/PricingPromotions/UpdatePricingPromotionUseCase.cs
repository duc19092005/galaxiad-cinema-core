using System;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Domain.Entities.Promotions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.PricingPromotions;
using Cinema.Application.Exceptions;
using Cinema.Domain.Utils;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.PricingPromotions;

public class UpdatePricingPromotionUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPricingPromotionRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly GetPricingPromotionByIdUseCase _getPricingPromotionByIdUseCase;

    public UpdatePricingPromotionUseCase(
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

    public async Task<PricingPromotionDto> ExecuteAsync(Guid id, PricingPromotionUpsertDto dto)
    {
        var promotion = await _repository.GetPromotionByIdAsync(id);

        if (promotion == null)
        {
            throw new NotFoundException("Pricing promotion not found.");
        }

        promotion.Name = dto.Name.Trim();
        promotion.Slug = await PricingPromotionHelper.BuildUniqueSlugAsync(_repository, dto.Slug, dto.Title, id);
        promotion.Title = dto.Title.Trim();
        promotion.ShortDescription = dto.ShortDescription.Trim();
        promotion.Description = dto.Description.Trim();
        promotion.TermsAndConditions = dto.TermsAndConditions.Trim();
        promotion.ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl.Trim();
        promotion.IsActive = dto.IsActive;
        promotion.ExcludeHolidays = dto.ExcludeHolidays;
        promotion.StartDate = DateTimeHelper.NormalizeIncoming(dto.StartDate);
        promotion.EndDate = DateTimeHelper.NormalizeIncoming(dto.EndDate);
        promotion.UpdatedAt = DateTime.UtcNow;
        promotion.UpdatedBy = TryGetUserId();

        _repository.RemovePromotionRulesRange(promotion.Rules);
        promotion.Rules = dto.Rules.Select(PricingPromotionHelper.BuildRule).ToList();

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
