using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.Contracts;

public class ApproveContractUseCase
{
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public ApproveContractUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<int> ExecuteAsync(Guid contractId, CancellationToken ct)
    {
        if (!_userContext.IsInRole("Admin"))
            throw new AppException("Chỉ Admin mới có quyền duyệt hợp đồng.", 403, "FORBIDDEN");

        var contract = await _repository.GetContractByIdAsync(contractId, ct);
        if (contract == null)
            throw new AppException("Không tìm thấy hợp đồng.", 404, "CONTRACT_NOT_FOUND");

        if (contract.Status != ContractStatus.PendingReview)
            throw new AppException("Chỉ hồ sơ PENDING_REVIEW mới được duyệt.", 409, "CONTRACT_STATE_CONFLICT");

        var revision = await _repository.GetCurrentRevisionAsync(contractId, ct);
        if (revision == null)
            throw new AppException("Không tìm thấy revision hợp đồng.", 404, "REVISION_NOT_FOUND");

        ContractRevisionValidator.Validate(revision);

        contract.Status = ContractStatus.ReadyToSign;
        contract.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync(ct);
        return revision.RevisionNumber;
    }
}
