using System.Text.Json;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.MovieChangeRequests;

public class ApproveMovieChangeRequestUseCase
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public ApproveMovieChangeRequestUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<string> ExecuteAsync(Guid id, CancellationToken ct)
    {
        if (!_userContext.IsInRole("Admin"))
            throw new AppException("Chỉ Admin mới có quyền duyệt yêu cầu thay đổi.", 403, "FORBIDDEN");

        var userId = _userContext.GetUserId();
        await using var tx = await _repository.BeginTransactionAsync(ct);

        var item = await _repository.GetMovieChangeRequestByIdAsync(id, ct);
        if (item == null)
            throw new AppException("Không tìm thấy yêu cầu thay đổi.", 404, "CHANGE_REQUEST_NOT_FOUND");

        if (item.Status != MovieChangeRequestStatus.PendingReview)
            throw new AppException("Chỉ yêu cầu PENDING_REVIEW mới được duyệt.", 409, "CONTRACT_STATE_CONFLICT");

        var rawChanges = Parse(item.ProposedChangesJson);
        var stringChanges = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var (field, element) in rawChanges)
        {
            var text = element.ValueKind == JsonValueKind.Null ? "" : element.GetString() ?? "";
            stringChanges[field] = text;
        }

        await _repository.ApplyApprovedMovieChangesAsync(item.MovieId, stringChanges, userId, ct);

        item.Status = MovieChangeRequestStatus.Approved;
        item.ReviewedByUserId = userId;
        item.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync(ct);

        return MovieChangeRequestStatus.Approved.ToString();
    }

    private static Dictionary<string, JsonElement> Parse(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json, JsonOptions) ?? [];
        }
        catch
        {
            return [];
        }
    }
}
