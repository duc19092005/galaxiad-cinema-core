using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.Contracts;

public class ListContractsUseCase
{
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public ListContractsUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<List<ResContractListItemDto>> ExecuteAsync(ContractStatus? status, CancellationToken ct)
    {
        var userId = _userContext.GetUserId();
        var isAdmin = _userContext.IsInRole("Admin");

        var contracts = await _repository.ListContractsAsync(status, userId, isAdmin, ct);

        return contracts.Select(x => new ResContractListItemDto(
            x.ContractId,
            x.InternalCode,
            x.CounterpartyContractNumber,
            x.Distributor?.LegalName,
            x.AssignedMovieManagerId,
            x.AssignedMovieManager?.UserName,
            x.Status.ToString(),
            x.ProcessingStatus.ToString(),
            x.CurrentRevisionNumber,
            x.CreatedAt,
            x.UpdatedAt)).ToList();
    }
}
