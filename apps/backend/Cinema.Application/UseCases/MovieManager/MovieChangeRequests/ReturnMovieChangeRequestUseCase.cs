using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.MovieChangeRequests;

public class ReturnMovieChangeRequestUseCase
{
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public ReturnMovieChangeRequestUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<string> ExecuteAsync(Guid id, ReviewMovieChangeRequestDto request, CancellationToken ct)
    {
        if (!_userContext.IsInRole("Admin"))
            throw new AppException("Chỉ Admin mới có quyền trả lại yêu cầu thay đổi.", 403, "FORBIDDEN");

        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new AppException("Bắt buộc nhập lý do.", 400, "REASON_REQUIRED");

        var item = await _repository.GetMovieChangeRequestByIdAsync(id, ct);
        if (item == null)
            throw new AppException("Không tìm thấy yêu cầu thay đổi.", 404, "CHANGE_REQUEST_NOT_FOUND");

        if (item.Status != MovieChangeRequestStatus.PendingReview)
            throw new AppException("Chỉ yêu cầu PENDING_REVIEW mới được trả lại.", 409, "CONTRACT_STATE_CONFLICT");

        item.Status = MovieChangeRequestStatus.Returned;
        item.ReviewNote = request.Reason;
        item.ReviewedByUserId = _userContext.GetUserId();
        item.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync(ct);
        return MovieChangeRequestStatus.Returned.ToString();
    }
}
