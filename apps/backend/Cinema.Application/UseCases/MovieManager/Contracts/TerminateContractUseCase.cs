using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.Contracts;

public class TerminateContractUseCase
{
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public TerminateContractUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<string> ExecuteAsync(Guid contractId, ReviewDecisionReqDto request, CancellationToken ct)
    {
        if (!_userContext.IsInRole("Admin"))
            throw new AppException("Chỉ Admin mới có quyền chấm dứt hợp đồng.", 403, "FORBIDDEN");

        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new AppException("Bắt buộc nhập lý do chấm dứt.", 400, "REASON_REQUIRED");

        var contract = await _repository.GetContractByIdAsync(contractId, ct);
        if (contract == null)
            throw new AppException("Không tìm thấy hợp đồng.", 404, "CONTRACT_NOT_FOUND");

        if (contract.Status is not (ContractStatus.Activated or ContractStatus.Suspended))
            throw new AppException("Hợp đồng không ở trạng thái có thể chấm dứt.", 409, "CONTRACT_STATE_CONFLICT");

        contract.Status = ContractStatus.Terminated;
        contract.UpdatedAt = DateTime.UtcNow;

        await _repository.SetExhibitionRightsActiveStateAsync(contractId, isActive: false, checkEndsAt: false, ct);
        await _repository.SaveChangesAsync(ct);

        return ContractStatus.Terminated.ToString();
    }
}
