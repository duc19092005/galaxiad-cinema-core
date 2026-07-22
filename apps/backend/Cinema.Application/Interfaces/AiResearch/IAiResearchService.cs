using Cinema.Application.Dtos.AiResearch;

namespace Cinema.Application.Interfaces.AiResearch;

public interface IAiResearchService
{
    Task<AiResearchJobSummaryDto> CreateAsync(
        CreateAiResearchJobRequest request,
        Guid createdByUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AiResearchJobSummaryDto>> ListAsync(
        Guid createdByUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    Task<AiResearchJobDetailDto?> GetAsync(
        Guid jobId,
        Guid createdByUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AiResearchEventDto>> GetEventsAfterAsync(
        Guid jobId,
        long afterEventId,
        Guid createdByUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    Task<bool> CancelAsync(
        Guid jobId,
        Guid createdByUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default);
}
