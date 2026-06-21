using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.Promotions;
using Cinema.Application.Interfaces.PricingPromotions;
using Cinema.Domain.Enums;
using Cinema.Domain.Utils;

namespace Cinema.Application.UseCases.PricingPromotions;

public class CalculatePricingPromotionUseCase
{
    private readonly IPricingPromotionRepository _repository;

    public CalculatePricingPromotionUseCase(IPricingPromotionRepository repository)
    {
        _repository = repository;
    }

    public async Task<PricingPromotionCalculationResult> ExecuteAsync(
        MovieScheduleInfoEntity schedule,
        decimal currentPrice,
        Guid? userSegmentId = null)
    {
        var result = new PricingPromotionCalculationResult
        {
            BasePrice = currentPrice,
            FinalPrice = currentPrice
        };

        var vietnamStart = DateTimeHelper.ToVietnamTime(schedule.StartTime);
        var showDateUtc = schedule.StartTime;
        var showDateVn = vietnamStart.Date;
        var showTime = vietnamStart.TimeOfDay;
        var showDayMask = DaysOfWeekMaskHelper.ToMask(vietnamStart.DayOfWeek);
        var cinemaId = schedule.AuditoriumInfoEntities?.CinemaId;

        var rules = await _repository.GetRulesForCalculationAsync(
            showDateUtc,
            showDayMask,
            schedule.MovieFormatId,
            cinemaId,
            schedule.AuditoriumId,
            userSegmentId);

        var matchingRules = new List<PricingPromotionRuleEntity>();
        foreach (var rule in rules)
        {
            if (!IsTimeMatch(rule, showTime))
            {
                continue;
            }

            if (rule.PricingPromotionEntity.ExcludeHolidays
                && await _repository.IsHolidayAsync(showDateVn))
            {
                continue;
            }

            matchingRules.Add(rule);
        }

        var fixedRule = matchingRules
            .Where(x => x.PromotionType == PromotionTypeEnum.FixedTicketPrice)
            .OrderByDescending(x => x.Priority)
            .ThenBy(x => x.AdjustmentValue)
            .FirstOrDefault();

        if (fixedRule != null)
        {
            var before = result.FinalPrice;
            result.FinalPrice = Math.Max(0, fixedRule.AdjustmentValue);
            result.AppliedPromotions.Add(PricingPromotionHelper.MapApplied(fixedRule, before, result.FinalPrice));
            result.TotalAdjustmentAmount = result.FinalPrice - result.BasePrice;
            return result;
        }

        foreach (var rule in matchingRules
                     .OrderByDescending(x => x.Priority)
                     .ThenBy(x => x.AdjustmentValue))
        {
            var before = result.FinalPrice;
            result.FinalPrice = ApplyRule(rule, result.FinalPrice);
            result.AppliedPromotions.Add(PricingPromotionHelper.MapApplied(rule, before, result.FinalPrice));
        }

        result.TotalAdjustmentAmount = result.FinalPrice - result.BasePrice;
        return result;
    }

    private static bool IsTimeMatch(PricingPromotionRuleEntity rule, TimeSpan showTime)
    {
        if (!rule.TimeFrom.HasValue && !rule.TimeTo.HasValue)
        {
            return true;
        }

        var from = rule.TimeFrom ?? TimeSpan.Zero;
        var to = rule.TimeTo ?? new TimeSpan(23, 59, 59);
        return from <= to
            ? showTime >= from && showTime <= to
            : showTime >= from || showTime <= to;
    }

    private static decimal ApplyRule(PricingPromotionRuleEntity rule, decimal currentPrice)
    {
        var next = rule.PromotionType switch
        {
            PromotionTypeEnum.PercentDiscount => currentPrice * (1 - rule.AdjustmentValue / 100m),
            PromotionTypeEnum.FixedDiscount => currentPrice - rule.AdjustmentValue,
            PromotionTypeEnum.Surcharge => currentPrice * (1 + rule.AdjustmentValue / 100m),
            _ => currentPrice
        };

        return Math.Max(0, Math.Round(next, 0));
    }
}

