using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.Contracts;

public sealed class AssignContractUseCase(IContractRepository repository, IUserContextService userContext)
{
    private void RequireAdmin()
    {
        if (!userContext.IsInRole("Admin")) throw new AppException("Chỉ Admin được phân công đối soát.", 403, "FORBIDDEN");
    }

    public Task<List<ContractReviewerDto>> ListAsync(CancellationToken ct)
    {
        RequireAdmin();
        return repository.ListReviewersAsync(ct);
    }

    public async Task ExecuteAsync(Guid id, Guid reviewerId, CancellationToken ct)
    {
        RequireAdmin();
        var contract = await repository.GetContractByIdAsync(id, ct)
            ?? throw new AppException("Không tìm thấy hợp đồng.", 404, "CONTRACT_NOT_FOUND");
        if (contract.Status != ContractStatus.Draft || contract.ProcessingStatus != ContractProcessingStatus.AwaitingDataApproval)
            throw new AppException("Chỉ giao hồ sơ nháp sau khi OCR hoàn tất.", 409, "CONTRACT_STATE_CONFLICT");
        if (!(await repository.ListReviewersAsync(ct)).Any(x => x.UserId == reviewerId))
            throw new AppException("Chọn người có vai trò MovieManager.", 400, "INVALID_ASSIGNEE");
        var revision = await repository.GetCurrentRevisionAsync(id, ct)
            ?? throw new AppException("Không tìm thấy phiên bản.", 404, "REVISION_NOT_FOUND");
        ContractReviewHistory.Append(revision, userContext.GetUserId(), "ASSIGN", new { previousAssigneeId = contract.AssignedMovieManagerId, reviewerId });
        contract.AssignedMovieManagerId = reviewerId;
        contract.UpdatedAt = DateTime.UtcNow;
        revision.DataReviewed = false;
        revision.FinancialPolicyReviewed = false;
        await repository.SaveChangesAsync(ct);
    }
}
