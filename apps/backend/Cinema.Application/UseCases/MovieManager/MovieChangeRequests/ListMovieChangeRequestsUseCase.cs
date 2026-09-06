using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;

namespace Cinema.Application.UseCases.MovieManager.MovieChangeRequests;

public class ListMovieChangeRequestsUseCase
{
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public ListMovieChangeRequestsUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<List<ResMovieChangeRequestDto>> ExecuteAsync(Guid movieId, CancellationToken ct)
    {
        var userId = _userContext.GetUserId();
        var isAdmin = _userContext.IsInRole("Admin");

        var list = await _repository.ListMovieChangeRequestsAsync(movieId, userId, isAdmin, ct);

        return list.Select(x => new ResMovieChangeRequestDto(
            x.MovieChangeRequestId,
            x.MovieId,
            x.RequestedByUserId,
            x.Status.ToString(),
            x.Reason,
            x.OriginalSnapshotJson,
            x.ProposedChangesJson,
            x.ReviewNote,
            x.ReviewedByUserId,
            x.CreatedAt,
            x.UpdatedAt
        )).ToList();
    }
}
