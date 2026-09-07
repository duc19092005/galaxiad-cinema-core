using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.Contracts;

public class TriggerContractExtractionUseCase
{
    private readonly IContractRepository _repository;
    private readonly IContractExtractionQueueService _queueService;
    private readonly IUserContextService _userContext;

    public TriggerContractExtractionUseCase(
        IContractRepository repository,
        IContractExtractionQueueService queueService,
        IUserContextService userContext)
    {
        _repository = repository;
        _queueService = queueService;
        _userContext = userContext;
    }

    public async Task<(string JobId, string ProcessingStatus)> ExecuteAsync(Guid contractId, CancellationToken ct)
    {
        var userId = _userContext.GetUserId();
        var isAdmin = _userContext.IsInRole("Admin");

        var contract = await _repository.GetEditableContractAsync(contractId, userId, isAdmin, ct);
        if (contract == null)
            throw new AppException("Không tìm thấy hợp đồng.", 404, "CONTRACT_NOT_FOUND");
        if (contract.Status != ContractStatus.Draft)
            throw new AppException("Hồ sơ đã khóa.", 409, "CONTRACT_STATE_CONFLICT");
        if (contract.ProcessingStatus is ContractProcessingStatus.Queued or ContractProcessingStatus.Processing)
            throw new AppException("OCR đang chạy.", 409, "CONTRACT_PROCESSING");

        var revision = await _repository.GetCurrentRevisionAsync(contractId, ct);
        if (revision == null || revision.Documents.Count == 0)
            throw new AppException("Hãy upload tài liệu trước khi phân tích.", 400, "CONTRACT_DOCUMENT_REQUIRED");

        contract.ProcessingStatus = ContractProcessingStatus.Queued;
        revision.DataReviewed = false;
        revision.FinancialPolicyReviewed = false;
        await _repository.SaveChangesAsync(ct);

        var jobId = _queueService.EnqueueExtraction(contractId, revision.ContractRevisionId);
        return (jobId, "Queued");
    }
}
