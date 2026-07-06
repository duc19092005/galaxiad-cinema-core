using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Interfaces.PricingPromotions;
using Cinema.Domain.Entities.Promotions;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Enums;

namespace Cinema.Infrastructure.Persistence.Repositories.PricingPromotions;

public class PricingPromotionRepository : IPricingPromotionRepository
{
    private readonly CinemaDbContext _dbContext;

    public PricingPromotionRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<PricingPromotionEntity>> GetActivePublicPromotionsAsync()
    {
        var now = DateTime.UtcNow;
        return await _dbContext.Set<PricingPromotionEntity>()
            .Include(x => x.Rules)
                .ThenInclude(x => x.MovieFormatInfoEntity)
            .Include(x => x.Rules)
                .ThenInclude(x => x.CinemaInfoEntity)
            .Include(x => x.Rules)
                .ThenInclude(x => x.AuditoriumInfoEntity)
            .Where(x => x.IsActive
                        && (!x.StartDate.HasValue || x.StartDate <= now)
                        && (!x.EndDate.HasValue || x.EndDate >= now)
                        && x.Rules.Any(r => r.IsActive && r.PromotionType != PromotionTypeEnum.Surcharge))
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync();
    }

    public async Task<List<PricingPromotionEntity>> GetAllPromotionsAsync()
    {
        return await _dbContext.Set<PricingPromotionEntity>()
            .Include(x => x.Rules)
                .ThenInclude(x => x.MovieFormatInfoEntity)
            .Include(x => x.Rules)
                .ThenInclude(x => x.CinemaInfoEntity)
            .Include(x => x.Rules)
                .ThenInclude(x => x.AuditoriumInfoEntity)
            .Include(x => x.Rules)
                .ThenInclude(x => x.UserSegmentsInfoEntity)
            .OrderByDescending(x => x.UpdatedAt)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<PricingPromotionEntity?> GetPromotionByIdAsync(Guid id)
    {
        return await _dbContext.Set<PricingPromotionEntity>()
            .Include(x => x.Rules)
                .ThenInclude(x => x.MovieFormatInfoEntity)
            .Include(x => x.Rules)
                .ThenInclude(x => x.CinemaInfoEntity)
            .Include(x => x.Rules)
                .ThenInclude(x => x.AuditoriumInfoEntity)
            .Include(x => x.Rules)
                .ThenInclude(x => x.UserSegmentsInfoEntity)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.PricingPromotionId == id);
    }

    public async Task<PricingPromotionEntity?> GetPromotionBySlugAsync(string slug)
    {
        return await _dbContext.Set<PricingPromotionEntity>()
            .Include(x => x.Rules)
                .ThenInclude(x => x.MovieFormatInfoEntity)
            .Include(x => x.Rules)
                .ThenInclude(x => x.CinemaInfoEntity)
            .Include(x => x.Rules)
                .ThenInclude(x => x.AuditoriumInfoEntity)
            .Include(x => x.Rules)
                .ThenInclude(x => x.UserSegmentsInfoEntity)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Slug == slug);
    }

    public async Task<PricingPromotionEntity?> GetActivePromotionBySlugAsync(string slug)
    {
        var now = DateTime.UtcNow;
        return await _dbContext.Set<PricingPromotionEntity>()
            .Include(x => x.Rules)
                .ThenInclude(x => x.MovieFormatInfoEntity)
            .Include(x => x.Rules)
                .ThenInclude(x => x.CinemaInfoEntity)
            .Include(x => x.Rules)
                .ThenInclude(x => x.AuditoriumInfoEntity)
            .Include(x => x.Rules)
                .ThenInclude(x => x.UserSegmentsInfoEntity)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Slug == slug
                                      && x.IsActive
                                      && (!x.StartDate.HasValue || x.StartDate <= now)
                                      && (!x.EndDate.HasValue || x.EndDate >= now)
                                      && x.Rules.Any(r => r.IsActive && r.PromotionType != PromotionTypeEnum.Surcharge));
    }

    public async Task<bool> SlugExistsExceptAsync(string slug, Guid? currentId)
    {
        return await _dbContext.Set<PricingPromotionEntity>()
            .AnyAsync(x => x.Slug == slug && (!currentId.HasValue || x.PricingPromotionId != currentId.Value));
    }

    public async Task AddPromotionAsync(PricingPromotionEntity promotion)
    {
        await _dbContext.Set<PricingPromotionEntity>().AddAsync(promotion);
    }

    public void UpdatePromotion(PricingPromotionEntity promotion)
    {
        _dbContext.Set<PricingPromotionEntity>().Update(promotion);
    }

    public void RemovePromotionRulesRange(IEnumerable<PricingPromotionRuleEntity> rules)
    {
        _dbContext.Set<PricingPromotionRuleEntity>().RemoveRange(rules);
    }

    public void RemovePromotion(PricingPromotionEntity promotion)
    {
        _dbContext.Set<PricingPromotionEntity>().Remove(promotion);
    }

    public async Task<List<MovieFormatInfoEntity>> GetMovieFormatsAsync()
    {
        return await _dbContext.Set<MovieFormatInfoEntity>()
            .OrderBy(x => x.MovieFormatName)
            .ToListAsync();
    }

    public async Task<List<CinemaInfoEntity>> GetCinemasAsync()
    {
        return await _dbContext.Set<CinemaInfoEntity>()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.CinemaName)
            .ToListAsync();
    }

    public async Task<List<AuditoriumInfoEntities>> GetAuditoriumsAsync()
    {
        return await _dbContext.Set<AuditoriumInfoEntities>()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.AuditoriumNumber)
            .ToListAsync();
    }

    public async Task<List<Cinema.Domain.Entities.UserInfos.UserSegmentsInfoEntity>> GetUserSegmentsAsync()
    {
        return await _dbContext.Set<Cinema.Domain.Entities.UserInfos.UserSegmentsInfoEntity>()
            .OrderBy(x => x.UserSegmentName)
            .ToListAsync();
    }

    public async Task<List<PricingPromotionRuleEntity>> FindConflictingRulesAsync(
        List<PricingPromotionRuleEntity> newRules,
        Guid? excludePromotionId,
        DateTime? promotionStartDate,
        DateTime? promotionEndDate)
    {
        // Load all active rules from active promotions (excluding the promotion being edited)
        var existingRules = await _dbContext.Set<PricingPromotionRuleEntity>()
            .Include(x => x.PricingPromotionEntity)
            .Include(x => x.MovieFormatInfoEntity)
            .Include(x => x.CinemaInfoEntity)
            .Include(x => x.UserSegmentsInfoEntity)
            .Where(x => x.IsActive
                        && x.PricingPromotionEntity.IsActive
                        && (!excludePromotionId.HasValue || x.PricingPromotionId != excludePromotionId.Value))
            .AsNoTracking()
            .ToListAsync();

        var conflictingRuleIds = new HashSet<Guid>();

        foreach (var newRule in newRules)
        {
            foreach (var existing in existingRules)
            {
                if (conflictingRuleIds.Contains(existing.PricingPromotionRuleId))
                    continue;

                if (AreRulesConflicting(newRule, existing, promotionStartDate, promotionEndDate))
                    conflictingRuleIds.Add(existing.PricingPromotionRuleId);
            }
        }

        return existingRules.Where(x => conflictingRuleIds.Contains(x.PricingPromotionRuleId)).ToList();
    }

    public async Task<List<PricingPromotionRuleEntity>> GetRulesByIdsAsync(List<Guid> ruleIds)
    {
        return await _dbContext.Set<PricingPromotionRuleEntity>()
            .Include(x => x.PricingPromotionEntity)
            .Where(x => ruleIds.Contains(x.PricingPromotionRuleId))
            .ToListAsync();
    }

    private static bool AreRulesConflicting(
        PricingPromotionRuleEntity a,
        PricingPromotionRuleEntity b,
        DateTime? aPromoStart,
        DateTime? aPromoEnd)
    {
        // Same promotion type
        if (a.PromotionType != b.PromotionType)
            return false;

        // Format overlap: both null (all) OR one null (all) OR same specific
        if (a.MovieFormatId.HasValue && b.MovieFormatId.HasValue && a.MovieFormatId != b.MovieFormatId)
            return false;

        // Cinema overlap
        if (a.CinemaId.HasValue && b.CinemaId.HasValue && a.CinemaId != b.CinemaId)
            return false;

        // User segment overlap
        if (a.UserSegmentId.HasValue && b.UserSegmentId.HasValue && a.UserSegmentId != b.UserSegmentId)
            return false;

        // Days of week overlap (bitwise AND)
        if ((a.DaysOfWeekMask & b.DaysOfWeekMask) == 0)
            return false;

        // Time overlap (considering overnight ranges like 22:00–02:00)
        if (a.TimeFrom.HasValue && a.TimeTo.HasValue && b.TimeFrom.HasValue && b.TimeTo.HasValue)
        {
            if (!TimeRangesOverlap(a.TimeFrom.Value, a.TimeTo.Value, b.TimeFrom.Value, b.TimeTo.Value))
                return false;
        }

        // Date overlap at rule level
        if (!DateRangesOverlap(a.StartDate, a.EndDate, b.StartDate, b.EndDate))
            return false;

        // Date overlap at promotion level (new rule uses passed-in dates, existing rule uses nav property)
        var bPromoStart = b.PricingPromotionEntity?.StartDate;
        var bPromoEnd = b.PricingPromotionEntity?.EndDate;
        if (!DateRangesOverlap(aPromoStart, aPromoEnd, bPromoStart, bPromoEnd))
            return false;

        return true;
    }

    private static bool TimeRangesOverlap(TimeSpan fromA, TimeSpan toA, TimeSpan fromB, TimeSpan toB)
    {
        // Handle overnight ranges (e.g., 22:00–02:00)
        if (fromA <= toA && fromB <= toB)
        {
            // Both normal ranges
            return fromA < toB && fromB < toA;
        }

        if (fromA > toA && fromB > toB)
        {
            // Both overnight ranges — always overlap
            return true;
        }

        // One overnight, one normal
        if (fromA > toA)
        {
            // A is overnight, B is normal
            return toA > fromB || fromA < toB;
        }
        else
        {
            // B is overnight, A is normal
            return toB > fromA || fromB < toA;
        }
    }

    private static bool DateRangesOverlap(DateTime? startA, DateTime? endA, DateTime? startB, DateTime? endB)
    {
        var aStart = startA ?? DateTime.MinValue;
        var aEnd = endA ?? DateTime.MaxValue;
        var bStart = startB ?? DateTime.MinValue;
        var bEnd = endB ?? DateTime.MaxValue;

        return aStart <= bEnd && bStart <= aEnd;
    }

    public async Task<List<PricingPromotionRuleEntity>> GetRulesForCalculationAsync(
        DateTime showDateUtc, 
        int showDayMask, 
        Guid movieFormatId, 
        Guid? cinemaId, 
        Guid auditoriumId, 
        Guid? userSegmentId,
        MembershipRankEnum? membershipRank)
    {
        return await _dbContext.Set<PricingPromotionRuleEntity>()
            .Include(x => x.PricingPromotionEntity)
            .Where(x => x.IsActive
                        && x.PricingPromotionEntity.IsActive
                        && (!x.PricingPromotionEntity.StartDate.HasValue || x.PricingPromotionEntity.StartDate <= showDateUtc)
                        && (!x.PricingPromotionEntity.EndDate.HasValue || x.PricingPromotionEntity.EndDate >= showDateUtc)
                        && (!x.StartDate.HasValue || x.StartDate <= showDateUtc)
                        && (!x.EndDate.HasValue || x.EndDate >= showDateUtc)
                        && (!x.MovieFormatId.HasValue || x.MovieFormatId == movieFormatId)
                        && (!x.CinemaId.HasValue || x.CinemaId == cinemaId)
                        && (!x.AuditoriumId.HasValue || x.AuditoriumId == auditoriumId)
                        && (!x.UserSegmentId.HasValue || x.UserSegmentId == userSegmentId)
                        && (x.DaysOfWeekMask & showDayMask) != 0)
            .ToListAsync();
    }

    public async Task<bool> IsHolidayAsync(DateTime vietnamDate)
    {
        var date = vietnamDate.Date;
        return await _dbContext.Set<HolidayCalendarEntity>()
            .AnyAsync(x => x.IsActive && x.Date == date);
    }
}
