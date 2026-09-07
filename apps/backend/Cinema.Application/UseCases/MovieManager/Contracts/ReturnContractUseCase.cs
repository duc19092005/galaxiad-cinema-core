using System.Text.Json;
using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.Contracts;

public class ReturnContractUseCase
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public ReturnContractUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task ExecuteAsync(Guid contractId, ReviewDecisionReqDto request, CancellationToken ct)
    {
        if (!_userContext.IsInRole("Admin"))
            throw new AppException("Chỉ Admin mới có quyền thực hiện.", 403, "FORBIDDEN");

        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new AppException("Bắt buộc nhập lý do trả hồ sơ.", 400, "REASON_REQUIRED");

        var contract = await _repository.GetContractByIdAsync(contractId, ct);
        if (contract == null)
            throw new AppException("Không tìm thấy hợp đồng.", 404, "CONTRACT_NOT_FOUND");

        if (contract.Status is not (ContractStatus.PendingReview or ContractStatus.ReadyToSign))
            throw new AppException("Hồ sơ không thể trả lại ở trạng thái hiện tại.", 409, "CONTRACT_STATE_CONFLICT");

        contract.Status = ContractStatus.Draft;
        contract.UpdatedAt = DateTime.UtcNow;

        var revision = await _repository.GetCurrentRevisionAsync(contractId, ct);
        if (revision != null)
        {
            ContractReviewHistory.Append(revision, _userContext.GetUserId(), "RETURN", new { request.Reason }, _userContext.GetUserName());
            revision.DataReviewed = false;
            revision.FinancialPolicyReviewed = false;
        }

        await _repository.SaveChangesAsync(ct);
    }
}
