using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Domain.Entities.Promotions;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Application.Interfaces.PricingPromotions;

public interface IPricingPromotionRepository
{
    Task<List<PricingPromotionEntity>> GetActivePublicPromotionsAsync();
    Task<List<PricingPromotionEntity>> GetAllPromotionsAsync();
    Task<PricingPromotionEntity?> GetPromotionByIdAsync(Guid id);
    Task<PricingPromotionEntity?> GetPromotionBySlugAsync(string slug);
    Task<PricingPromotionEntity?> GetActivePromotionBySlugAsync(string slug);
    Task<bool> SlugExistsExceptAsync(string slug, Guid? currentId);
    Task AddPromotionAsync(PricingPromotionEntity promotion);
    void UpdatePromotion(PricingPromotionEntity promotion);
    void RemovePromotionRulesRange(IEnumerable<PricingPromotionRuleEntity> rules);
    void RemovePromotion(PricingPromotionEntity promotion);
    Task SaveChangesAsync();
    
    // Options
    Task<List<MovieFormatInfoEntity>> GetMovieFormatsAsync();
    Task<List<CinemaInfoEntity>> GetCinemasAsync();
    Task<List<AuditoriumInfoEntities>> GetAuditoriumsAsync();
    Task<List<UserSegmentsInfoEntity>> GetMembershipTiersAsync();
    
    // Calculation
    Task<List<PricingPromotionRuleEntity>> GetRulesForCalculationAsync(
        DateTime showDateUtc, 
        int showDayMask, 
        Guid movieFormatId, 
        Guid? cinemaId, 
        Guid auditoriumId, 
        Guid? userSegmentId);
    Task<bool> IsHolidayAsync(DateTime vietnamDate);
}
