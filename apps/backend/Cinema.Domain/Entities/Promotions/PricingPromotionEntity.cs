using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Domain.Entities.Promotions;

public class PricingPromotionEntity
{
    [Key]
    public Guid PricingPromotionId { get; set; }

    [Column(TypeName = "nvarchar(150)")]
    public string Name { get; set; } = string.Empty;

    [Column(TypeName = "varchar(180)")]
    public string Slug { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(200)")]
    public string Title { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(500)")]
    public string ShortDescription { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string Description { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string TermsAndConditions { get; set; } = string.Empty;

    [Column(TypeName = "varchar(2048)")]
    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public bool ExcludeHolidays { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Guid? CreatedBy { get; set; }

    public Guid? UpdatedBy { get; set; }

    public UserInfoEntity? CreatedByUser { get; set; }

    public UserInfoEntity? UpdatedByUser { get; set; }

    public List<PricingPromotionRuleEntity> Rules { get; set; } = [];
}
