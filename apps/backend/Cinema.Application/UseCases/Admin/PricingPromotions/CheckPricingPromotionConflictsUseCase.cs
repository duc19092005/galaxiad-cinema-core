using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Application.Interfaces.PricingPromotions;
using Cinema.Domain.Utils;

namespace Cinema.Application.UseCases.Admin.PricingPromotions;

public class CheckPricingPromotionConflictsUseCase
{
    private readonly IPricingPromotionRepository _repository;

    public CheckPricingPromotionConflictsUseCase(IPricingPromotionRepository repository)
    {
        _repository = repository;
    }

    public async Task<ConflictCheckResponseDto> ExecuteAsync(PricingPromotionUpsertDto dto, Guid? excludePromotionId)
    {
        var newRules = dto.Rules.SelectMany(PricingPromotionHelper.BuildRules).ToList();
        var promoStart = DateTimeHelper.NormalizeIncoming(dto.StartDate);
        var promoEnd = DateTimeHelper.NormalizeIncoming(dto.EndDate);
        var conflictingExisting = await _repository.FindConflictingRulesAsync(newRules, excludePromotionId, promoStart, promoEnd);

        if (conflictingExisting.Count == 0)
        {
            return new ConflictCheckResponseDto { HasConflicts = false };
        }

        var conflicts = conflictingExisting.Select(rule => new PricingPromotionConflictDto
        {
            ConflictRuleId = rule.PricingPromotionRuleId,
            ConflictRuleDescription = BuildRuleDescription(rule),
            ConflictPromotionId = rule.PricingPromotionId,
            ConflictPromotionTitle = rule.PricingPromotionEntity?.Title ?? "Unknown",
            PromotionType = rule.PromotionType,
            PromotionTypeName = rule.PromotionType.ToString(),
            AdjustmentValue = rule.AdjustmentValue,
            MovieFormatName = rule.MovieFormatInfoEntity?.MovieFormatName,
            CinemaName = rule.CinemaInfoEntity?.CinemaName,
            UserSegmentName = rule.UserSegmentsInfoEntity?.UserSegmentName,
            DaysOfWeekText = DaysOfWeekMaskHelper.DecodeText(rule.DaysOfWeekMask),
            TimeRange = rule.TimeFrom.HasValue && rule.TimeTo.HasValue
                ? $"{rule.TimeFrom:hh\\:mm}–{rule.TimeTo:hh\\:mm}"
                : null
        }).ToList();

        return new ConflictCheckResponseDto
        {
            HasConflicts = true,
            Conflicts = conflicts
        };
    }

    private static string BuildRuleDescription(Domain.Entities.Promotions.PricingPromotionRuleEntity rule)
    {
        var parts = new List<string>
        {
            rule.PromotionType.ToString(),
            rule.AdjustmentValue.ToString("G")
        };

        if (rule.MovieFormatInfoEntity != null)
            parts.Add(rule.MovieFormatInfoEntity.MovieFormatName);
        else
            parts.Add("All formats");

        if (rule.CinemaInfoEntity != null)
            parts.Add(rule.CinemaInfoEntity.CinemaName);
        else
            parts.Add("All cinemas");

        return string.Join(" · ", parts);
    }
}
