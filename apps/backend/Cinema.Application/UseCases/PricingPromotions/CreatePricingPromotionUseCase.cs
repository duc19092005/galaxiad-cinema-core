using System;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Domain.Entities.Promotions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.PricingPromotions;
using Cinema.Domain.Utils;

namespace Cinema.Application.UseCases.PricingPromotions;

public class CreatePricingPromotionUseCase
{
    private readonly IPricingPromotionRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly GetPricingPromotionByIdUseCase _getPricingPromotionByIdUseCase;

    public CreatePricingPromotionUseCase(
        IPricingPromotionRepository repository,
        IUserContextService userContextService,
        GetPricingPromotionByIdUseCase getPricingPromotionByIdUseCase)
    {
        _repository = repository;
        _userContextService = userContextService;
        _getPricingPromotionByIdUseCase = getPricingPromotionByIdUseCase;
    }

    public async Task<PricingPromotionDto> ExecuteAsync(PricingPromotionUpsertDto dto)
    {
        var userId = TryGetUserId();
        var slug = await PricingPromotionHelper.BuildUniqueSlugAsync(_repository, dto.Slug, dto.Title);
        var promotion = new PricingPromotionEntity
        {
            PricingPromotionId = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            Slug = slug,
            Title = dto.Title.Trim(),
            ShortDescription = dto.ShortDescription.Trim(),
            Description = dto.Description.Trim(),
            TermsAndConditions = dto.TermsAndConditions.Trim(),
            ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl.Trim(),
            IsActive = dto.IsActive,
            ExcludeHolidays = dto.ExcludeHolidays,
            StartDate = DateTimeHelper.NormalizeIncoming(dto.StartDate),
            EndDate = DateTimeHelper.NormalizeIncoming(dto.EndDate),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            UpdatedBy = userId,
            Rules = dto.Rules.Select(PricingPromotionHelper.BuildRule).ToList()
        };

        await _repository.AddPromotionAsync(promotion);
        await _repository.SaveChangesAsync();
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
