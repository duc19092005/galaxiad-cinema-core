using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Cinema.Application.Dtos.AiResearch;
using Cinema.Application.Interfaces.AiResearch;
using Cinema.Domain.Entities.AiResearch;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Cinema.Infrastructure.ExternalServices.Ai;

public sealed class AiResearchService : IAiResearchService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    private static readonly Dictionary<string, string[]> AllowedModules = new(StringComparer.OrdinalIgnoreCase)
    {
        ["PricingAnalysis"] = ["pricing", "promotion", "competition", "trend_demand", "background"],
        ["SiteLocationFeasibility"] = ["zoning_policy", "real_estate_price", "lease_cost", "infrastructure_trend", "investment_incentive"]
    };

    private readonly CinemaDbContext _dbContext;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AiResearchService> _logger;

    public AiResearchService(
        CinemaDbContext dbContext,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<AiResearchService> logger)
    {
        _dbContext = dbContext;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<AiResearchJobSummaryDto> CreateAsync(
        CreateAiResearchJobRequest request,
        Guid createdByUserId,
        CancellationToken cancellationToken = default)
    {
        var modules = ValidateAndResolveModules(request);
        var job = new AiResearchJobEntity
        {
            JobId = Guid.NewGuid(),
            City = request.City,
            AnalysisType = request.AnalysisType,
            RunMode = request.RunMode,
            SelectedModulesJson = JsonSerializer.Serialize(modules, JsonOptions),
            Notes = (request.Notes ?? string.Empty).Trim(),
            Status = "queued",
            BudgetCap = request.BudgetCap,
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.AiResearchJobEntity.Add(job);
        AddEvent(job.JobId, "queued", new
        {
            jobId = job.JobId,
            status = "queued",
            budgetUsed = 0,
            budgetCap = job.BudgetCap,
            message = "Job đã vào hàng đợi"
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
        return MapSummary(job);
    }

    public async Task<IReadOnlyList<AiResearchJobSummaryDto>> ListAsync(
        Guid createdByUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.AiResearchJobEntity.AsNoTracking();
        if (!isAdmin)
        {
            query = query.Where(item => item.CreatedByUserId == createdByUserId);
        }
        var jobs = await query
            .OrderByDescending(item => item.CreatedAt)
            .Take(50)
            .ToListAsync(cancellationToken);
        return jobs.Select(MapSummary).ToList();
    }

    public async Task<AiResearchJobDetailDto?> GetAsync(
        Guid jobId,
        Guid createdByUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var job = await AuthorizedJobs(createdByUserId, isAdmin)
            .AsNoTracking()
            .Include(item => item.Claims)
                .ThenInclude(claim => claim.Evidence)
            .Include(item => item.Report)
            .FirstOrDefaultAsync(item => item.JobId == jobId, cancellationToken);
        return job is null ? null : MapDetail(job);
    }

    public async Task<IReadOnlyList<AiResearchEventDto>> GetEventsAfterAsync(
        Guid jobId,
        long afterEventId,
        Guid createdByUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var authorized = await AuthorizedJobs(createdByUserId, isAdmin)
            .AsNoTracking()
            .AnyAsync(item => item.JobId == jobId, cancellationToken);
        if (!authorized)
        {
            return [];
        }
        var events = await _dbContext.AiResearchEventEntity
            .AsNoTracking()
            .Where(item => item.JobId == jobId && item.EventId > afterEventId)
            .OrderBy(item => item.EventId)
            .Take(100)
            .ToListAsync(cancellationToken);
        return events.Select(MapEvent).ToList();
    }

    public async Task<bool> CancelAsync(
        Guid jobId,
        Guid createdByUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var job = await AuthorizedJobs(createdByUserId, isAdmin)
            .FirstOrDefaultAsync(item => item.JobId == jobId, cancellationToken);
        if (job is null || IsTerminal(job.Status))
        {
            return false;
        }
        job.Status = "cancelled";
        job.CompletedAt = DateTime.UtcNow;
        AddEvent(job.JobId, "cancelled", new
        {
            jobId,
            status = "cancelled",
            budgetUsed = job.BudgetUsed,
            budgetCap = job.BudgetCap,
            message = "Job đã được hủy"
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task RunAsync(Guid jobId)
    {
        var job = await _dbContext.AiResearchJobEntity.FirstOrDefaultAsync(item => item.JobId == jobId);
        if (job is null || IsTerminal(job.Status))
        {
            return;
        }

        try
        {
            job.Status = "planning";
            await _dbContext.SaveChangesAsync();

            var client = _httpClientFactory.CreateClient();
            client.Timeout = Timeout.InfiniteTimeSpan;
            var baseUrl = (_configuration["AiService:RestUrl"] ?? "http://cinema-ai-service:8000").TrimEnd('/');
            var request = new
            {
                jobId = job.JobId.ToString(),
                job.City,
                job.AnalysisType,
                selectedModules = DeserializeModules(job.SelectedModulesJson),
                job.BudgetCap,
                job.Notes
            };
            using var message = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/business-research/run/stream")
            {
                Content = JsonContent.Create(request, options: JsonOptions)
            };
            using var response = await client.SendAsync(message, HttpCompletionOption.ResponseHeadersRead);
            response.EnsureSuccessStatusCode();
            await using var stream = await response.Content.ReadAsStreamAsync();
            using var reader = new StreamReader(stream, Encoding.UTF8);

            while (!reader.EndOfStream)
            {
                var line = await reader.ReadLineAsync();
                if (string.IsNullOrWhiteSpace(line))
                {
                    continue;
                }
                await _dbContext.Entry(job).ReloadAsync();
                if (job.Status == "cancelled")
                {
                    return;
                }
                using var document = JsonDocument.Parse(line);
                var root = document.RootElement;
                var kind = root.GetProperty("kind").GetString();
                if (kind == "event")
                {
                    var eventType = root.GetProperty("eventType").GetString() ?? "researching";
                    var payload = root.GetProperty("payload").Clone();
                    job.Status = eventType;
                    if (payload.TryGetProperty("budgetUsed", out var budgetUsed))
                    {
                        job.BudgetUsed = budgetUsed.GetInt32();
                    }
                    AddEvent(job.JobId, eventType, payload);
                    await _dbContext.SaveChangesAsync();
                }
                else if (kind == "result")
                {
                    var result = root.GetProperty("result").Deserialize<PythonResearchResult>(JsonOptions)
                                 ?? throw new InvalidOperationException("Python AI service returned an empty result.");
                    await PersistResultAsync(job, result);
                }
                else if (kind == "error")
                {
                    var payload = root.GetProperty("payload").Clone();
                    throw new InvalidOperationException(
                        payload.TryGetProperty("message", out var error) ? error.GetString() : "Python AI service failed.");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI research job {JobId} failed", jobId);
            await _dbContext.Entry(job).ReloadAsync();
            if (job.Status != "cancelled")
            {
                job.Status = "failed";
                job.ErrorMessage = ex.Message;
                job.CompletedAt = DateTime.UtcNow;
                AddEvent(job.JobId, "failed", new
                {
                    jobId,
                    status = "failed",
                    budgetUsed = job.BudgetUsed,
                    budgetCap = job.BudgetCap,
                    message = ex.Message
                });
                await _dbContext.SaveChangesAsync();
            }
        }
    }

    private async Task PersistResultAsync(AiResearchJobEntity job, PythonResearchResult result)
    {
        foreach (var claim in result.Claims)
        {
            var claimId = Guid.TryParse(claim.Id, out var parsedClaimId) ? parsedClaimId : Guid.NewGuid();
            var claimEntity = new AiResearchClaimEntity
            {
                ClaimId = claimId,
                JobId = job.JobId,
                Text = claim.Text,
                Category = claim.Category,
                IsCritical = claim.IsCritical,
                Status = claim.Status,
                IterationCount = claim.IterationCount,
                Confidence = Convert.ToDecimal(claim.Confidence),
                Classification = claim.Classification,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            foreach (var evidence in claim.Evidence)
            {
                claimEntity.Evidence.Add(new AiResearchEvidenceEntity
                {
                    EvidenceId = Guid.NewGuid(),
                    ClaimId = claimId,
                    Url = evidence.Url,
                    Title = evidence.Title,
                    Snippet = evidence.Snippet,
                    ExtractedContent = evidence.ExtractedContent,
                    PublishedDate = evidence.PublishedDate,
                    QueryUsed = evidence.QueryUsed,
                    SourceDomain = evidence.SourceDomain,
                    SourceType = evidence.SourceType,
                    DomainTrustTier = evidence.DomainTrustTier,
                    Relation = evidence.Relation,
                    IterationAdded = evidence.IterationAdded,
                    CreatedAt = DateTime.UtcNow
                });
            }
            job.Claims.Add(claimEntity);
        }

        var sections = result.Report.TryGetProperty("sections", out var sectionsElement)
            ? sectionsElement.GetRawText()
            : "[]";
        var summary = result.Report.TryGetProperty("summary", out var summaryElement)
            ? summaryElement.GetRawText()
            : "{}";
        job.Report = new AiResearchReportEntity
        {
            JobId = job.JobId,
            GeneratedAt = DateTime.UtcNow,
            SectionsJson = sections,
            SummaryJson = summary
        };
        job.Status = "done";
        job.BudgetUsed = result.BudgetUsed;
        job.CompletedAt = DateTime.UtcNow;
        AddEvent(job.JobId, "done", new
        {
            jobId = job.JobId,
            status = "done",
            budgetUsed = job.BudgetUsed,
            budgetCap = job.BudgetCap,
            message = "Báo cáo đã hoàn thành"
        });
        await _dbContext.SaveChangesAsync();
    }

    private IQueryable<AiResearchJobEntity> AuthorizedJobs(Guid userId, bool isAdmin)
    {
        var query = _dbContext.AiResearchJobEntity.AsQueryable();
        return isAdmin ? query : query.Where(item => item.CreatedByUserId == userId);
    }

    private static List<string> ValidateAndResolveModules(CreateAiResearchJobRequest request)
    {
        if (request.City is not ("HCM" or "HN"))
        {
            throw new ArgumentException("City must be HCM or HN.");
        }
        if (!AllowedModules.TryGetValue(request.AnalysisType, out var allowed))
        {
            throw new ArgumentException("Unsupported analysis type.");
        }
        if (request.BudgetCap is < 1 or > 100)
        {
            throw new ArgumentException("Budget cap must be between 1 and 100.");
        }
        if (request.RunMode.Equals("RunAll", StringComparison.OrdinalIgnoreCase))
        {
            return allowed.ToList();
        }
        if (!request.RunMode.Equals("SelectedModules", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Run mode must be RunAll or SelectedModules.");
        }
        var selected = request.SelectedModules.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        if (selected.Count == 0 || selected.Any(module => !allowed.Contains(module, StringComparer.OrdinalIgnoreCase)))
        {
            throw new ArgumentException("Selected modules are empty or invalid.");
        }
        return selected;
    }

    private void AddEvent(Guid jobId, string eventType, object payload)
    {
        var payloadJson = payload is JsonElement element
            ? element.GetRawText()
            : JsonSerializer.Serialize(payload, JsonOptions);
        _dbContext.AiResearchEventEntity.Add(new AiResearchEventEntity
        {
            JobId = jobId,
            EventType = eventType,
            PayloadJson = payloadJson,
            CreatedAt = DateTime.UtcNow
        });
    }

    private static AiResearchJobSummaryDto MapSummary(AiResearchJobEntity item) => new()
    {
        JobId = item.JobId,
        City = item.City,
        AnalysisType = item.AnalysisType,
        RunMode = item.RunMode,
        SelectedModules = DeserializeModules(item.SelectedModulesJson),
        Status = item.Status,
        BudgetUsed = item.BudgetUsed,
        BudgetCap = item.BudgetCap,
        CreatedAt = item.CreatedAt,
        CompletedAt = item.CompletedAt,
        ErrorMessage = item.ErrorMessage
    };

    private static AiResearchJobDetailDto MapDetail(AiResearchJobEntity item)
    {
        var summary = MapSummary(item);
        return new AiResearchJobDetailDto
        {
            JobId = summary.JobId,
            City = summary.City,
            AnalysisType = summary.AnalysisType,
            RunMode = summary.RunMode,
            SelectedModules = summary.SelectedModules,
            Status = summary.Status,
            BudgetUsed = summary.BudgetUsed,
            BudgetCap = summary.BudgetCap,
            CreatedAt = summary.CreatedAt,
            CompletedAt = summary.CompletedAt,
            ErrorMessage = summary.ErrorMessage,
            Notes = item.Notes,
            Claims = item.Claims.OrderBy(claim => claim.Category).Select(claim => new AiResearchClaimDto
            {
                ClaimId = claim.ClaimId,
                Text = claim.Text,
                Category = claim.Category,
                IsCritical = claim.IsCritical,
                Status = claim.Status,
                IterationCount = claim.IterationCount,
                Confidence = claim.Confidence,
                Classification = claim.Classification,
                Evidence = claim.Evidence.Select(evidence => new AiResearchEvidenceDto
                {
                    EvidenceId = evidence.EvidenceId,
                    Url = evidence.Url,
                    Title = evidence.Title,
                    Snippet = evidence.Snippet,
                    PublishedDate = evidence.PublishedDate,
                    SourceDomain = evidence.SourceDomain,
                    SourceType = evidence.SourceType,
                    DomainTrustTier = evidence.DomainTrustTier,
                    Relation = evidence.Relation
                }).ToList()
            }).ToList(),
            Report = item.Report is null
                ? null
                : new AiResearchReportDto
                {
                    GeneratedAt = item.Report.GeneratedAt,
                    Sections = JsonDocument.Parse(item.Report.SectionsJson).RootElement.Clone(),
                    Summary = JsonDocument.Parse(item.Report.SummaryJson).RootElement.Clone()
                }
        };
    }

    private static AiResearchEventDto MapEvent(AiResearchEventEntity item) => new()
    {
        EventId = item.EventId,
        JobId = item.JobId,
        EventType = item.EventType,
        Payload = JsonDocument.Parse(item.PayloadJson).RootElement.Clone(),
        CreatedAt = item.CreatedAt
    };

    private static List<string> DeserializeModules(string json) =>
        JsonSerializer.Deserialize<List<string>>(json, JsonOptions) ?? [];

    private static bool IsTerminal(string status) =>
        status is "done" or "failed" or "cancelled";

    private sealed class PythonResearchResult
    {
        public string JobId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int BudgetUsed { get; set; }
        public List<PythonClaim> Claims { get; set; } = [];
        public JsonElement Report { get; set; }
    }

    private sealed class PythonClaim
    {
        public string Id { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public bool IsCritical { get; set; }
        public string Status { get; set; } = string.Empty;
        public int IterationCount { get; set; }
        public double Confidence { get; set; }
        public string Classification { get; set; } = string.Empty;
        public List<PythonEvidence> Evidence { get; set; } = [];
    }

    private sealed class PythonEvidence
    {
        public string Url { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Snippet { get; set; } = string.Empty;
        public string ExtractedContent { get; set; } = string.Empty;
        public DateTime? PublishedDate { get; set; }
        public string QueryUsed { get; set; } = string.Empty;
        public string SourceDomain { get; set; } = string.Empty;
        public string SourceType { get; set; } = string.Empty;
        public string DomainTrustTier { get; set; } = string.Empty;
        public int IterationAdded { get; set; }
        public string Relation { get; set; } = "supports";
    }
}
