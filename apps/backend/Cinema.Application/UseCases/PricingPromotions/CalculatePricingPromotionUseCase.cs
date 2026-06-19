using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.Promotions;
using Cinema.Application.Interfaces.PricingPromotions;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Utils;

namespace Cinema.Application.UseCases.PricingPromotions;

public class CalculatePricingPromotionUseCase
{
    private readonly IUnitOfWork _unitOfWork;

    public CalculatePricingPromotionUseCase(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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

        var rules = await _unitOfWork.Repository<PricingPromotionRuleEntity>().Query()
            .Include(x => x.PricingPromotionEntity)
            .Where(x => x.IsActive
                        && x.PricingPromotionEntity.IsActive
                        && (!x.PricingPromotionEntity.StartDate.HasValue || x.PricingPromotionEntity.StartDate <= showDateUtc)
                        && (!x.PricingPromotionEntity.EndDate.HasValue || x.PricingPromotionEntity.EndDate >= showDateUtc)
                        && (!x.StartDate.HasValue || x.StartDate <= showDateUtc)
                        && (!x.EndDate.HasValue || x.EndDate >= showDateUtc)
                        && (!x.MovieFormatId.HasValue || x.MovieFormatId == schedule.MovieFormatId)
                        && (!x.CinemaId.HasValue || x.CinemaId == cinemaId)
                        && (!x.AuditoriumId.HasValue || x.AuditoriumId == schedule.AuditoriumId)
                        && (!x.RequiredMembershipTierId.HasValue || x.RequiredMembershipTierId == userSegmentId)
                        && (x.DaysOfWeekMask & showDayMask) != 0)
            .ToListAsync();

        var matchingRules = new List<PricingPromotionRuleEntity>();
        foreach (var rule in rules)
        {
            if (!IsTimeMatch(rule, showTime))
            {
                continue;
            }

            if (rule.PricingPromotionEntity.ExcludeHolidays
                && await IsHolidayAsync(showDateVn))
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

    private async Task<bool> IsHolidayAsync(DateTime vietnamDate)
    {
        var date = vietnamDate.Date;
        return await _unitOfWork.Repository<HolidayCalendarEntity>().Query()
            .AnyAsync(x => x.IsActive && x.Date == date);
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
