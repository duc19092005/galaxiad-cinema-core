using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Domain.Entities.Promotions;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Enums;
using Cinema.Domain.Utils;

namespace Cinema.Application.UseCases.PricingPromotions;

public static class PricingPromotionHelper
{
    public static IQueryable<PricingPromotionEntity> QueryPromotions(IUnitOfWork unitOfWork)
    {
        return unitOfWork.Repository<PricingPromotionEntity>().Query()
            .Include(x => x.Rules)
            .ThenInclude(x => x.MovieFormatInfoEntity)
            .Include(x => x.Rules)
            .ThenInclude(x => x.CinemaInfoEntity)
            .Include(x => x.Rules)
            .ThenInclude(x => x.AuditoriumInfoEntity)
            .Include(x => x.Rules)
            .ThenInclude(x => x.RequiredMembershipTierEntity);
    }

    public static PricingPromotionRuleEntity BuildRule(PricingPromotionRuleRequestDto dto)
    {
        return new PricingPromotionRuleEntity
        {
            PricingPromotionRuleId = dto.PricingPromotionRuleId.GetValueOrDefault(Guid.NewGuid()),
            MovieFormatId = dto.MovieFormatId,
            CinemaId = dto.CinemaId,
            AuditoriumId = dto.AuditoriumId,
            RequiredMembershipTierId = dto.RequiredMembershipTierId,
            PromotionType = dto.PromotionType,
            AdjustmentValue = dto.AdjustmentValue,
            StartDate = DateTimeHelper.NormalizeIncoming(dto.StartDate),
            EndDate = DateTimeHelper.NormalizeIncoming(dto.EndDate),
            TimeFrom = dto.TimeFrom,
            TimeTo = dto.TimeTo,
            DaysOfWeekMask = DaysOfWeekMaskHelper.Encode(dto.DaysOfWeek),
            Priority = dto.Priority,
            IsActive = dto.IsActive
        };
    }

    public static PricingPromotionDto MapPromotion(PricingPromotionEntity promotion)
    {
        return new PricingPromotionDto
        {
            PricingPromotionId = promotion.PricingPromotionId,
            Name = promotion.Name,
            Slug = promotion.Slug,
            Title = promotion.Title,
            ShortDescription = promotion.ShortDescription,
            Description = promotion.Description,
            TermsAndConditions = promotion.TermsAndConditions,
            ImageUrl = promotion.ImageUrl,
            IsActive = promotion.IsActive,
            ExcludeHolidays = promotion.ExcludeHolidays,
            StartDate = promotion.StartDate,
            EndDate = promotion.EndDate,
            CreatedAt = promotion.CreatedAt,
            UpdatedAt = promotion.UpdatedAt,
            RuleCount = promotion.Rules.Count,
            Rules = promotion.Rules
                .OrderByDescending(x => x.Priority)
                .Select(MapRule)
                .ToList()
        };
    }

    public static PricingPromotionRuleDto MapRule(PricingPromotionRuleEntity rule)
    {
        return new PricingPromotionRuleDto
        {
            PricingPromotionRuleId = rule.PricingPromotionRuleId,
            MovieFormatId = rule.MovieFormatId,
            MovieFormatName = rule.MovieFormatInfoEntity?.MovieFormatName,
            CinemaId = rule.CinemaId,
            CinemaName = rule.CinemaInfoEntity?.CinemaName,
            AuditoriumId = rule.AuditoriumId,
            AuditoriumNumber = rule.AuditoriumInfoEntity?.AuditoriumNumber,
            RequiredMembershipTierId = rule.RequiredMembershipTierId,
            RequiredMembershipTierName = rule.RequiredMembershipTierEntity?.UserSegmentName,
            PromotionType = rule.PromotionType,
            PromotionTypeName = rule.PromotionType.ToString(),
            AdjustmentValue = rule.AdjustmentValue,
            StartDate = rule.StartDate,
            EndDate = rule.EndDate,
            TimeFrom = rule.TimeFrom,
            TimeTo = rule.TimeTo,
            DaysOfWeekMask = rule.DaysOfWeekMask,
            DaysOfWeek = DaysOfWeekMaskHelper.Decode(rule.DaysOfWeekMask),
            DaysOfWeekText = DaysOfWeekMaskHelper.DecodeText(rule.DaysOfWeekMask),
            Priority = rule.Priority,
            IsActive = rule.IsActive
        };
    }

    public static AppliedPricingPromotionDto MapApplied(PricingPromotionRuleEntity rule, decimal before, decimal after)
    {
        return new AppliedPricingPromotionDto
        {
            PromotionId = rule.PricingPromotionId,
            RuleId = rule.PricingPromotionRuleId,
            Title = rule.PricingPromotionEntity.Title,
            PromotionType = rule.PromotionType,
            PromotionTypeName = rule.PromotionType.ToString(),
            AdjustmentValue = rule.AdjustmentValue,
            AmountChanged = after - before,
            PriceBefore = before,
            PriceAfter = after
        };
    }

    public static async Task<string> BuildUniqueSlugAsync(IUnitOfWork unitOfWork, string? requestedSlug, string title, Guid? currentId = null)
    {
        var baseSlug = Slugify(string.IsNullOrWhiteSpace(requestedSlug) ? title : requestedSlug);
        var slug = baseSlug;
        var suffix = 2;
        while (await unitOfWork.Repository<PricingPromotionEntity>().Query()
                   .AnyAsync(x => x.Slug == slug && (!currentId.HasValue || x.PricingPromotionId != currentId.Value)))
        {
            slug = $"{baseSlug}-{suffix++}";
        }

        return slug;
    }

    public static string Slugify(string value)
    {
        var lower = value.Trim().ToLowerInvariant();
        var slug = Regex.Replace(lower, @"[^a-z0-9]+", "-").Trim('-');
        return string.IsNullOrWhiteSpace(slug) ? Guid.NewGuid().ToString("N")[..12] : slug;
    }
}
