using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Cinema.Domain.Entities.AiResearch;

public class AiResearchJobEntity
{
    [Key]
    public Guid JobId { get; set; }

    [MaxLength(10)]
    public string City { get; set; } = string.Empty;

    [MaxLength(80)]
    public string AnalysisType { get; set; } = string.Empty;

    [MaxLength(40)]
    public string RunMode { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string SelectedModulesJson { get; set; } = "[]";

    [Column(TypeName = "nvarchar(1000)")]
    public string Notes { get; set; } = string.Empty;

    [MaxLength(40)]
    public string Status { get; set; } = "queued";

    public int BudgetUsed { get; set; }
    public int BudgetCap { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    [Column(TypeName = "nvarchar(2000)")]
    public string? ErrorMessage { get; set; }

    public ICollection<AiResearchClaimEntity> Claims { get; set; } = new List<AiResearchClaimEntity>();
    public ICollection<AiResearchEventEntity> Events { get; set; } = new List<AiResearchEventEntity>();
    public AiResearchReportEntity? Report { get; set; }
}

public class AiResearchClaimEntity
{
    [Key]
    public Guid ClaimId { get; set; }
    public Guid JobId { get; set; }

    [Column(TypeName = "nvarchar(1000)")]
    public string Text { get; set; } = string.Empty;

    [MaxLength(80)]
    public string Category { get; set; } = string.Empty;

    public bool IsCritical { get; set; }

    [MaxLength(40)]
    public string Status { get; set; } = "unresolved";

    public int IterationCount { get; set; }
    public decimal Confidence { get; set; }

    [MaxLength(40)]
    public string Classification { get; set; } = "unknown";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public AiResearchJobEntity Job { get; set; } = null!;
    public ICollection<AiResearchEvidenceEntity> Evidence { get; set; } = new List<AiResearchEvidenceEntity>();
}

public class AiResearchEvidenceEntity
{
    [Key]
    public Guid EvidenceId { get; set; }
    public Guid ClaimId { get; set; }

    [Column(TypeName = "nvarchar(2048)")]
    public string Url { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(500)")]
    public string Title { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string Snippet { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string ExtractedContent { get; set; } = string.Empty;

    public DateTime? PublishedDate { get; set; }

    [Column(TypeName = "nvarchar(1000)")]
    public string QueryUsed { get; set; } = string.Empty;

    [MaxLength(255)]
    public string SourceDomain { get; set; } = string.Empty;

    [MaxLength(80)]
    public string SourceType { get; set; } = string.Empty;

    [MaxLength(20)]
    public string DomainTrustTier { get; set; } = "low";

    [MaxLength(20)]
    public string Relation { get; set; } = "supports";

    public int IterationAdded { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public AiResearchClaimEntity Claim { get; set; } = null!;
}

public class AiResearchReportEntity
{
    [Key]
    [ForeignKey(nameof(Job))]
    public Guid JobId { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    [Column(TypeName = "nvarchar(max)")]
    public string SectionsJson { get; set; } = "[]";

    [Column(TypeName = "nvarchar(max)")]
    public string SummaryJson { get; set; } = "{}";

    public AiResearchJobEntity Job { get; set; } = null!;
}

public class AiResearchEventEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long EventId { get; set; }
    public Guid JobId { get; set; }

    [MaxLength(50)]
    public string EventType { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string PayloadJson { get; set; } = "{}";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public AiResearchJobEntity Job { get; set; } = null!;
}
