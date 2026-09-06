using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.MovieChangeRequests;

public class SubmitMovieChangeRequestUseCase
{
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public SubmitMovieChangeRequestUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<string> ExecuteAsync(Guid id, CancellationToken ct)
    {
        var userId = _userContext.GetUserId();
        var isAdmin = _userContext.IsInRole("Admin");

        var item = await _repository.GetMovieChangeRequestOwnedAsync(id, userId, isAdmin, ct);
        if (item == null)
            throw new AppException("Không tìm thấy yêu cầu thay đổi.", 404, "CHANGE_REQUEST_NOT_FOUND");

        if (item.Status is not (MovieChangeRequestStatus.Draft or MovieChangeRequestStatus.Returned))
            throw new AppException("Chỉ yêu cầu DRAFT hoặc RETURNED mới được nộp.", 409, "CONTRACT_STATE_CONFLICT");

        item.Status = MovieChangeRequestStatus.PendingReview;
        item.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync(ct);
        return MovieChangeRequestStatus.PendingReview.ToString();
    }
}
