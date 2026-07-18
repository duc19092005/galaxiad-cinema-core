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
            // Drop any half-written report/claims from a previous Hangfire retry.
            await ClearJobArtifactsAsync(job.JobId);

            job.Status = "planning";
            job.ErrorMessage = null;
            job.CompletedAt = null;
            job.BudgetUsed = 0;
            AddEvent(job.JobId, "planning", new
            {
                jobId = job.JobId,
                status = "planning",
                budgetUsed = 0,
                budgetCap = job.BudgetCap,
                message = "Bắt đầu pipeline research (planner → search → arbitrator)"
            });
            await _dbContext.SaveChangesAsync();

            var client = _httpClientFactory.CreateClient();
            client.Timeout = Timeout.InfiniteTimeSpan;
            var baseUrl = (_configuration["AiService:BaseUrl"] ?? "http://cinema-ai-service:8000").TrimEnd('/');
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

            while (true)
            {
                var line = await reader.ReadLineAsync();
                if (line is null)
                {
                    break;
                }
                if (string.IsNullOrWhiteSpace(line))
                {
                    continue;
                }

                // Fresh read of cancel flag without poisoning the tracked graph.
                var cancelled = await _dbContext.AiResearchJobEntity
                    .AsNoTracking()
                    .AnyAsync(item => item.JobId == jobId && item.Status == "cancelled");
                if (cancelled)
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
                    // Map pipeline stages to a compact job status for the list UI.
                    job.Status = NormalizeJobStatus(eventType);
                    if (payload.TryGetProperty("budgetUsed", out var budgetUsed) && budgetUsed.ValueKind == JsonValueKind.Number)
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
            // Drop any failed claim/report graph so we can still mark the job failed.
            _dbContext.ChangeTracker.Clear();
            var failedJob = await _dbContext.AiResearchJobEntity.FirstOrDefaultAsync(item => item.JobId == jobId);
            if (failedJob is not null && failedJob.Status != "cancelled")
            {
                failedJob.Status = "failed";
                failedJob.ErrorMessage = Truncate(ex.Message, 2000);
                failedJob.CompletedAt = DateTime.UtcNow;
                AddEvent(failedJob.JobId, "failed", new
                {
                    jobId,
                    status = "failed",
                    budgetUsed = failedJob.BudgetUsed,
                    budgetCap = failedJob.BudgetCap,
                    message = Truncate(ex.Message, 500)
                });
                await _dbContext.SaveChangesAsync();
            }
        }
    }

    private async Task PersistResultAsync(AiResearchJobEntity job, PythonResearchResult result)
    {
        await ClearJobArtifactsAsync(job.JobId);

        // Detach leftover navigation items so EF does not try to UPDATE ghost claims.
        foreach (var entry in _dbContext.ChangeTracker.Entries<AiResearchClaimEntity>()
                     .Where(e => e.Entity.JobId == job.JobId)
                     .ToList())
        {
            entry.State = EntityState.Detached;
        }
        foreach (var entry in _dbContext.ChangeTracker.Entries<AiResearchReportEntity>()
                     .Where(e => e.Entity.JobId == job.JobId)
                     .ToList())
        {
            entry.State = EntityState.Detached;
        }

        var claimEntities = new List<AiResearchClaimEntity>();
        foreach (var claim in result.Claims)
        {
            var claimId = Guid.TryParse(claim.Id, out var parsedClaimId) ? parsedClaimId : Guid.NewGuid();
            var claimEntity = new AiResearchClaimEntity
            {
                ClaimId = claimId,
                JobId = job.JobId,
                Text = Truncate(claim.Text, 1000),
                Category = Truncate(claim.Category, 80),
                IsCritical = claim.IsCritical,
                Status = Truncate(claim.Status, 40),
                IterationCount = claim.IterationCount,
                Confidence = Math.Clamp(Convert.ToDecimal(claim.Confidence), 0m, 1m),
                Classification = Truncate(claim.Classification, 40),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            foreach (var evidence in claim.Evidence)
            {
                claimEntity.Evidence.Add(new AiResearchEvidenceEntity
                {
                    EvidenceId = Guid.NewGuid(),
                    ClaimId = claimId,
                    Url = Truncate(evidence.Url, 2048),
                    Title = Truncate(evidence.Title, 500),
                    Snippet = evidence.Snippet ?? string.Empty,
                    ExtractedContent = evidence.ExtractedContent ?? string.Empty,
                    PublishedDate = evidence.PublishedDate,
                    QueryUsed = Truncate(evidence.QueryUsed, 1000),
                    SourceDomain = Truncate(evidence.SourceDomain, 255),
                    SourceType = Truncate(evidence.SourceType, 80),
                    DomainTrustTier = Truncate(evidence.DomainTrustTier, 20),
                    Relation = Truncate(string.IsNullOrWhiteSpace(evidence.Relation) ? "supports" : evidence.Relation, 20),
                    IterationAdded = evidence.IterationAdded,
                    CreatedAt = DateTime.UtcNow
                });
            }
            claimEntities.Add(claimEntity);
        }

        _dbContext.AiResearchClaimEntity.AddRange(claimEntities);

        var sections = result.Report.ValueKind != JsonValueKind.Undefined
                       && result.Report.TryGetProperty("sections", out var sectionsElement)
            ? sectionsElement.GetRawText()
            : "[]";
        var summary = result.Report.ValueKind != JsonValueKind.Undefined
                      && result.Report.TryGetProperty("summary", out var summaryElement)
            ? summaryElement.GetRawText()
            : "{}";

        _dbContext.AiResearchReportEntity.Add(new AiResearchReportEntity
        {
            JobId = job.JobId,
            GeneratedAt = DateTime.UtcNow,
            SectionsJson = sections,
            SummaryJson = summary
        });

        job.Status = "done";
        job.BudgetUsed = result.BudgetUsed;
        job.CompletedAt = DateTime.UtcNow;
        job.ErrorMessage = null;
        AddEvent(job.JobId, "done", new
        {
            jobId = job.JobId,
            status = "done",
            budgetUsed = job.BudgetUsed,
            budgetCap = job.BudgetCap,
            resolvedClaims = claimEntities.Count(c => c.Status == "resolved"),
            totalClaims = claimEntities.Count,
            message = "Báo cáo đã hoàn thành"
        });
        await _dbContext.SaveChangesAsync();
    }

    private async Task ClearJobArtifactsAsync(Guid jobId)
    {
        var claimIds = await _dbContext.AiResearchClaimEntity
            .AsNoTracking()
            .Where(item => item.JobId == jobId)
            .Select(item => item.ClaimId)
            .ToListAsync();
        if (claimIds.Count > 0)
        {
            await _dbContext.AiResearchEvidenceEntity
                .Where(item => claimIds.Contains(item.ClaimId))
                .ExecuteDeleteAsync();
            await _dbContext.AiResearchClaimEntity
                .Where(item => item.JobId == jobId)
                .ExecuteDeleteAsync();
        }

        await _dbContext.AiResearchReportEntity
            .Where(item => item.JobId == jobId)
            .ExecuteDeleteAsync();
    }

    private static string NormalizeJobStatus(string eventType) => eventType switch
    {
        "queued" => "queued",
        "planning" or "claim_created" or "thought" => "planning",
        "researching" or "evidence_found" => "researching",
        "arbitrating" or "claim_resolved" or "claim_insufficient" => "arbitrating",
        "synthesizing" => "synthesizing",
        "done" => "done",
        "failed" => "failed",
        "cancelled" => "cancelled",
        _ => eventType
    };

    private static string Truncate(string? value, int maxLength)
    {
        if (string.IsNullOrEmpty(value))
        {
            return string.Empty;
        }
        return value.Length <= maxLength ? value : value[..maxLength];
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
