using System.ComponentModel.DataAnnotations;
using Shared.Enums;

namespace BusinessLayer.Dtos.PricingPromotions;

public class PricingPromotionRuleRequestDto
{
    public Guid? PricingPromotionRuleId { get; set; }
    public Guid? MovieFormatId { get; set; }
    public Guid? CinemaId { get; set; }
    public Guid? AuditoriumId { get; set; }
    public Guid? RequiredMembershipTierId { get; set; }
    [Required]
    public PromotionTypeEnum PromotionType { get; set; }
    [Range(0, 999999999)]
    public decimal AdjustmentValue { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public TimeSpan? TimeFrom { get; set; }
    public TimeSpan? TimeTo { get; set; }
    public List<string> DaysOfWeek { get; set; } = [];
    public int Priority { get; set; }
    public bool IsActive { get; set; } = true;
}

public class PricingPromotionUpsertDto
{
    [Required]
    [StringLength(150)]
    public string Name { get; set; } = string.Empty;
    [StringLength(180)]
    public string? Slug { get; set; }
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;
    [StringLength(500)]
    public string ShortDescription { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TermsAndConditions { get; set; } = string.Empty;
    [StringLength(2048)]
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public bool ExcludeHolidays { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public List<PricingPromotionRuleRequestDto> Rules { get; set; } = [];
}

public class PricingPromotionRuleDto
{
    public Guid PricingPromotionRuleId { get; set; }
    public Guid? MovieFormatId { get; set; }
    public string? MovieFormatName { get; set; }
    public Guid? CinemaId { get; set; }
    public string? CinemaName { get; set; }
    public Guid? AuditoriumId { get; set; }
    public string? AuditoriumNumber { get; set; }
    public Guid? RequiredMembershipTierId { get; set; }
    public string? RequiredMembershipTierName { get; set; }
    public PromotionTypeEnum PromotionType { get; set; }
    public string PromotionTypeName { get; set; } = string.Empty;
    public decimal AdjustmentValue { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public TimeSpan? TimeFrom { get; set; }
    public TimeSpan? TimeTo { get; set; }
    public int DaysOfWeekMask { get; set; }
    public List<string> DaysOfWeek { get; set; } = [];
    public string DaysOfWeekText { get; set; } = string.Empty;
    public int Priority { get; set; }
    public bool IsActive { get; set; }
}

public class PricingPromotionDto
{
    public Guid PricingPromotionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TermsAndConditions { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }
    public bool ExcludeHolidays { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int RuleCount { get; set; }
    public List<PricingPromotionRuleDto> Rules { get; set; } = [];
}

public class AppliedPricingPromotionDto
{
    public Guid PromotionId { get; set; }
    public Guid RuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public PromotionTypeEnum PromotionType { get; set; }
    public string PromotionTypeName { get; set; } = string.Empty;
    public decimal AdjustmentValue { get; set; }
    public decimal AmountChanged { get; set; }
    public decimal PriceBefore { get; set; }
    public decimal PriceAfter { get; set; }
}

public class PricingPromotionOptionsDto
{
    public List<PricingPromotionOptionDto> Formats { get; set; } = [];
    public List<PricingPromotionOptionDto> Cinemas { get; set; } = [];
    public List<PricingPromotionOptionDto> Auditoriums { get; set; } = [];
}

public class PricingPromotionOptionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
