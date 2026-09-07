using System.Net.Http.Headers;
using System.Text.Json;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Enums;
using Cinema.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Cinema.Infrastructure.ExternalServices.Contracts;

public sealed class ContractExtractionJob
{
    private readonly CinemaDbContext _db;
    private readonly IHttpClientFactory _clients;
    private readonly ILogger<ContractExtractionJob> _logger;
    private readonly IContractObjectStorage _storage;

    public ContractExtractionJob(CinemaDbContext db, IHttpClientFactory clients,
        ILogger<ContractExtractionJob> logger, IContractObjectStorage storage)
    {
        _db = db;
        _clients = clients;
        _logger = logger;
        _storage = storage;
    }

    public async Task RunAsync(Guid contractId, Guid revisionId, CancellationToken ct)
    {
        var contract = await _db.FilmContractEntity.SingleAsync(x => x.ContractId == contractId, ct);
        var revision = await _db.ContractRevisionEntity.Include(x => x.Documents)
            .SingleAsync(x => x.ContractRevisionId == revisionId && x.ContractId == contractId, ct);
        if (!revision.IsCurrent || contract.Status != ContractStatus.Draft) return;
        contract.ProcessingStatus = ContractProcessingStatus.Processing;
        await _db.SaveChangesAsync(ct);

        try
        {
            using var form = new MultipartFormDataContent();
            foreach (var document in revision.Documents)
            {
                var bytes = await _storage.GetAsync(document.StoragePath, ct)
                    ?? throw new FileNotFoundException("Contract object is missing.", document.StoragePath);
                var content = new ByteArrayContent(bytes);
                content.Headers.ContentType = new MediaTypeHeaderValue(document.ContentType);
                form.Add(content, "files", document.FileName);
            }
            var response = await _clients.CreateClient("ContractAi").PostAsync("api/contracts/extract", form, ct);
            var payload = await response.Content.ReadAsStringAsync(ct);
            response.EnsureSuccessStatusCode();
            revision.ExtractionJson = payload;
            using var json = JsonDocument.Parse(payload);
            revision.ExtractedText = json.RootElement.TryGetProperty("text", out var text) ? text.GetString() ?? "" : "";
            if (!contract.DistributorId.HasValue && json.RootElement.TryGetProperty("analysis", out var analysis)
                && analysis.TryGetProperty("distributor", out var party) && party.ValueKind == JsonValueKind.Object
                && party.TryGetProperty("legalName", out var nameElement) && nameElement.ValueKind == JsonValueKind.String
                && nameElement.GetString() is { Length: > 0 and <= 200 } name)
            {
                var partner = await _db.DistributorEntity.FirstOrDefaultAsync(x => x.LegalName == name, ct);
                if (partner == null)
                {
                    partner = new Cinema.Domain.Entities.Contracts.DistributorEntity { DistributorId = Guid.NewGuid(), LegalName = name };
                    _db.DistributorEntity.Add(partner);
                }
                contract.DistributorId = partner.DistributorId;
            }
            contract.ProcessingStatus = ContractProcessingStatus.AwaitingDataApproval;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Contract extraction failed for {ContractId}/{RevisionId}",
                contractId, revisionId);
            contract.ProcessingStatus = ContractProcessingStatus.Failed;
            revision.ExtractionJson = JsonSerializer.Serialize(new
            {
                errorCode = "CONTRACT_EXTRACTION_FAILED",
                message = "Không thể đọc tài liệu. Có thể thử lại mà không tạo hồ sơ mới."
            });
        }

        contract.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
