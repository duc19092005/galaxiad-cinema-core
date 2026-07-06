using System;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Domain.Entities.Promotions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.PricingPromotions;
using Cinema.Domain.Utils;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Admin.PricingPromotions;

public class CreatePricingPromotionUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPricingPromotionRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly GetPricingPromotionByIdUseCase _getPricingPromotionByIdUseCase;

    public CreatePricingPromotionUseCase(
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

    public async Task<PricingPromotionDto> ExecuteAsync(PricingPromotionUpsertDto dto)
    {
        // Resolve conflicts: deactivate conflicting rules and their parent promotions
        if (dto.DeactivateRuleIds.Count > 0)
        {
            var rulesToDeactivate = await _repository.GetRulesByIdsAsync(dto.DeactivateRuleIds);
            var promotionIds = new HashSet<Guid>();
            foreach (var rule in rulesToDeactivate)
            {
                rule.IsActive = false;
                if (rule.PricingPromotionEntity != null)
                    promotionIds.Add(rule.PricingPromotionId);
            }
            // Deactivate parent promotions that had all their rules replaced
            foreach (var promoId in promotionIds)
            {
                var promo = await _repository.GetPromotionByIdAsync(promoId);
                if (promo != null)
                {
                    promo.IsActive = false;
                    promo.UpdatedAt = DateTime.UtcNow;
                    _repository.UpdatePromotion(promo);
                }
            }
        }

        var userId = TryGetUserId();
        var slug = await PricingPromotionHelper.BuildUniqueSlugAsync(_repository, dto.Slug, dto.Title);
        var promotion = new PricingPromotionEntity
        {
            PricingPromotionId = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            Slug = slug,
            Title = dto.Title.Trim(),
            ShortDescription = (dto.ShortDescription ?? string.Empty).Trim(),
            Description = (dto.Description ?? string.Empty).Trim(),
            TermsAndConditions = (dto.TermsAndConditions ?? string.Empty).Trim(),
            ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl.Trim(),
            IsActive = dto.IsActive,
            ExcludeHolidays = dto.ExcludeHolidays,
            StartDate = DateTimeHelper.NormalizeIncoming(dto.StartDate),
            EndDate = DateTimeHelper.NormalizeIncoming(dto.EndDate),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            UpdatedBy = userId,
            Rules = dto.Rules.SelectMany(PricingPromotionHelper.BuildRules).ToList()
        };

        await _repository.AddPromotionAsync(promotion);
        await _unitOfWork.SaveChangesAsync();
        return await _getPricingPromotionByIdUseCase.ExecuteAsync(promotion.PricingPromotionId);
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
