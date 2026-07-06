using Cinema.Domain.Enums;

namespace Cinema.Application.Dtos.PricingPromotions;

public class PricingPromotionConflictDto
{
    public Guid ConflictRuleId { get; set; }
    public string ConflictRuleDescription { get; set; } = string.Empty;
    public Guid ConflictPromotionId { get; set; }
    public string ConflictPromotionTitle { get; set; } = string.Empty;
    public PromotionTypeEnum PromotionType { get; set; }
    public string PromotionTypeName { get; set; } = string.Empty;
    public decimal AdjustmentValue { get; set; }
    public string? MovieFormatName { get; set; }
    public string? CinemaName { get; set; }
    public string? UserSegmentName { get; set; }
    public string DaysOfWeekText { get; set; } = string.Empty;
    public string? TimeRange { get; set; }
}

public class ConflictCheckResponseDto
{
    public bool HasConflicts { get; set; }
    public List<PricingPromotionConflictDto> Conflicts { get; set; } = [];
}

public class PricingPromotionWithResolutionDto
{
    public PricingPromotionUpsertDto Promotion { get; set; } = new();
    public List<Guid> DeactivateRuleIds { get; set; } = [];
}
