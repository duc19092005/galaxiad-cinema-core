using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Interfaces.PricingPromotions;
using Cinema.Domain.Entities.Promotions;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;

namespace Cinema.Infrastructure.Repositories;

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
            .Include(x => x.Rules)
                .ThenInclude(x => x.RequiredMembershipTierEntity)
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
                .ThenInclude(x => x.RequiredMembershipTierEntity)
            .OrderByDescending(x => x.UpdatedAt)
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
                .ThenInclude(x => x.RequiredMembershipTierEntity)
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
                .ThenInclude(x => x.RequiredMembershipTierEntity)
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
                .ThenInclude(x => x.RequiredMembershipTierEntity)
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

    public async Task<List<UserSegmentsInfoEntity>> GetMembershipTiersAsync()
    {
        return await _dbContext.Set<UserSegmentsInfoEntity>()
            .OrderBy(x => x.UserSegmentName)
            .ToListAsync();
    }

    public async Task<List<PricingPromotionRuleEntity>> GetRulesForCalculationAsync(
        DateTime showDateUtc, 
        int showDayMask, 
        Guid movieFormatId, 
        Guid? cinemaId, 
        Guid auditoriumId, 
        Guid? userSegmentId)
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
                        && (!x.RequiredMembershipTierId.HasValue || x.RequiredMembershipTierId == userSegmentId)
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
