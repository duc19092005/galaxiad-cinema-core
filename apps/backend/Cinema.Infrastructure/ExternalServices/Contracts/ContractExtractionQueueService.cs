using Cinema.Application.Interfaces.Contracts;
using Hangfire;

namespace Cinema.Infrastructure.ExternalServices.Contracts;

public class ContractExtractionQueueService : IContractExtractionQueueService
{
    private readonly IBackgroundJobClient _jobs;

    public ContractExtractionQueueService(IBackgroundJobClient jobs)
    {
        _jobs = jobs;
    }

    public string EnqueueExtraction(Guid contractId, Guid revisionId)
    {
        return _jobs.Enqueue<ContractExtractionJob>(
            job => job.RunAsync(contractId, revisionId, CancellationToken.None));
    }
}
