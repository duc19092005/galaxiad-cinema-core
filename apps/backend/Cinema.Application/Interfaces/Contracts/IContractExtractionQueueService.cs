namespace Cinema.Application.Interfaces.Contracts;

public interface IContractExtractionQueueService
{
    string EnqueueExtraction(Guid contractId, Guid revisionId);
}
