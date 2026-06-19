using System;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Domain.Entities.Promotions;
using Cinema.Application.Interfaces;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Utils;

namespace Cinema.Application.UseCases.PricingPromotions;

public class CreatePricingPromotionUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserContextService _userContextService;
    private readonly GetPricingPromotionByIdUseCase _getPricingPromotionByIdUseCase;

    public CreatePricingPromotionUseCase(
        IUnitOfWork unitOfWork,
        IUserContextService userContextService,
        GetPricingPromotionByIdUseCase getPricingPromotionByIdUseCase)
    {
        _unitOfWork = unitOfWork;
        _userContextService = userContextService;
        _getPricingPromotionByIdUseCase = getPricingPromotionByIdUseCase;
    }

    public async Task<PricingPromotionDto> ExecuteAsync(PricingPromotionUpsertDto dto)
    {
        var userId = TryGetUserId();
        var slug = await PricingPromotionHelper.BuildUniqueSlugAsync(_unitOfWork, dto.Slug, dto.Title);
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

        await _unitOfWork.Repository<PricingPromotionEntity>().AddAsync(promotion);
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
