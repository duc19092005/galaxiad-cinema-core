using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.Contracts;

public class ResumeContractUseCase
{
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public ResumeContractUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<string> ExecuteAsync(Guid contractId, ReviewDecisionReqDto request, CancellationToken ct)
    {
        if (!_userContext.IsInRole("Admin"))
            throw new AppException("Chỉ Admin mới có quyền tiếp tục hợp đồng.", 403, "FORBIDDEN");

        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new AppException("Bắt buộc nhập lý do.", 400, "REASON_REQUIRED");

        var contract = await _repository.GetContractByIdAsync(contractId, ct);
        if (contract == null)
            throw new AppException("Không tìm thấy hợp đồng.", 404, "CONTRACT_NOT_FOUND");

        if (contract.Status != ContractStatus.Suspended)
            throw new AppException("Trạng thái hợp đồng không phù hợp.", 409, "CONTRACT_STATE_CONFLICT");

        contract.Status = ContractStatus.Activated;
        contract.UpdatedAt = DateTime.UtcNow;

        await _repository.SetExhibitionRightsActiveStateAsync(contractId, isActive: true, checkEndsAt: true, ct);
        await _repository.SaveChangesAsync(ct);

        return ContractStatus.Activated.ToString();
    }
}
