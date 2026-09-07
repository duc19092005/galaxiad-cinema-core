using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.Contracts;

public class SubmitContractForReviewUseCase
{
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public SubmitContractForReviewUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task ExecuteAsync(Guid contractId, CancellationToken ct)
    {
        var userId = _userContext.GetUserId();
        var isAdmin = _userContext.IsInRole("Admin");

        var contract = await _repository.GetEditableContractAsync(contractId, userId, isAdmin, ct);
        if (contract == null)
            throw new AppException("Không tìm thấy hợp đồng.", 404, "CONTRACT_NOT_FOUND");

        if (contract.Status != ContractStatus.Draft)
            throw new AppException("Hồ sơ không ở trạng thái DRAFT.", 409, "CONTRACT_STATE_CONFLICT");

        var revision = await _repository.GetCurrentRevisionAsync(contractId, ct);
        if (revision == null)
            throw new AppException("Không tìm thấy revision hợp đồng.", 404, "REVISION_NOT_FOUND");

        ContractRevisionValidator.Validate(revision);
        ContractReviewHistory.Append(revision, userId, "SUBMIT", new { revision.RevisionNumber });

        contract.Status = ContractStatus.PendingReview;
        contract.UpdatedAt = DateTime.UtcNow;
        await _repository.SaveChangesAsync(ct);
    }
}
