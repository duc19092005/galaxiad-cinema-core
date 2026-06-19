using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using BusinessLayer.Entities.CinemaInfos;
using BusinessLayer.Entities.MovieInfos;
using BusinessLayer.Entities.UserInfos;
using Shared.Enums;

namespace BusinessLayer.Entities.Promotions;

public class PricingPromotionRuleEntity
{
    [Key]
    public Guid PricingPromotionRuleId { get; set; }

    public Guid PricingPromotionId { get; set; }

    public PricingPromotionEntity PricingPromotionEntity { get; set; } = null!;

    public Guid? MovieFormatId { get; set; }

    public MovieFormatInfoEntity? MovieFormatInfoEntity { get; set; }

    public Guid? CinemaId { get; set; }

    public CinemaInfoEntity? CinemaInfoEntity { get; set; }

    public Guid? AuditoriumId { get; set; }

    public AuditoriumInfoEntities? AuditoriumInfoEntity { get; set; }

    public Guid? RequiredMembershipTierId { get; set; }

    public UserSegmentsInfoEntity? RequiredMembershipTierEntity { get; set; }

    public PromotionTypeEnum PromotionType { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal AdjustmentValue { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public TimeSpan? TimeFrom { get; set; }

    public TimeSpan? TimeTo { get; set; }

    public int DaysOfWeekMask { get; set; } = (int)DaysOfWeekMaskEnum.All;

    public int Priority { get; set; }

    public bool IsActive { get; set; } = true;
}
