using System.Text.Json;

namespace Cinema.Application.Dtos.AiResearch;

public sealed class CreateAiResearchJobRequest
{
    public string City { get; set; } = string.Empty;
    public string AnalysisType { get; set; } = string.Empty;
    public string RunMode { get; set; } = "RunAll";
    public List<string> SelectedModules { get; set; } = [];
    public int BudgetCap { get; set; } = 30;
    public string Notes { get; set; } = string.Empty;
}

public class AiResearchJobSummaryDto
{
    public Guid JobId { get; set; }
    public string City { get; set; } = string.Empty;
    public string AnalysisType { get; set; } = string.Empty;
    public string RunMode { get; set; } = string.Empty;
    public List<string> SelectedModules { get; set; } = [];
    public string Status { get; set; } = string.Empty;
    public int BudgetUsed { get; set; }
    public int BudgetCap { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? ErrorMessage { get; set; }
}

public sealed class AiResearchJobDetailDto : AiResearchJobSummaryDto
{
    public string Notes { get; set; } = string.Empty;
    public List<AiResearchClaimDto> Claims { get; set; } = [];
    public AiResearchReportDto? Report { get; set; }
}

public sealed class AiResearchClaimDto
{
    public Guid ClaimId { get; set; }
    public string Text { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsCritical { get; set; }
    public string Status { get; set; } = string.Empty;
    public int IterationCount { get; set; }
    public decimal Confidence { get; set; }
    public string Classification { get; set; } = string.Empty;
    public List<AiResearchEvidenceDto> Evidence { get; set; } = [];
}

public sealed class AiResearchEvidenceDto
{
    public Guid EvidenceId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Snippet { get; set; } = string.Empty;
    public DateTime? PublishedDate { get; set; }
    public string SourceDomain { get; set; } = string.Empty;
    public string SourceType { get; set; } = string.Empty;
    public string DomainTrustTier { get; set; } = string.Empty;
    public string Relation { get; set; } = string.Empty;
}

public sealed class AiResearchReportDto
{
    public DateTime GeneratedAt { get; set; }
    public JsonElement Sections { get; set; }
    public JsonElement Summary { get; set; }
}

public sealed class AiResearchEventDto
{
    public long EventId { get; set; }
    public Guid JobId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public JsonElement Payload { get; set; }
    public DateTime CreatedAt { get; set; }
}
