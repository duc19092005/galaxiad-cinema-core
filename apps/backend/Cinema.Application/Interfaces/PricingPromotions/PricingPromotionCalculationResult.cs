using System.Collections.Generic;
using System.Text.Json;
using Cinema.Application.Dtos.PricingPromotions;

namespace Cinema.Application.Interfaces.PricingPromotions;

public class PricingPromotionCalculationResult
{
    public decimal BasePrice { get; set; }
    public decimal FinalPrice { get; set; }
    public decimal TotalAdjustmentAmount { get; set; }
    public List<AppliedPricingPromotionDto> AppliedPromotions { get; set; } = [];
    public string SnapshotJson => JsonSerializer.Serialize(AppliedPromotions);
}
