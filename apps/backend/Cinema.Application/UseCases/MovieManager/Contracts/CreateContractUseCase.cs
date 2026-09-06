using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Entities.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.Contracts;

public class CreateContractUseCase
{
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public CreateContractUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<(Guid ContractId, string InternalCode)> ExecuteAsync(CreateContractReqDto request, CancellationToken ct)
    {
        var userId = _userContext.GetUserId();
        var isAdmin = _userContext.IsInRole("Admin");

        var assigneeId = isAdmin && request.AssignedMovieManagerId.HasValue
            ? request.AssignedMovieManagerId.Value
            : userId;

        var assigneeValid = await _repository.CanAssignUserAsync(assigneeId, ct);
        if (!assigneeValid)
        {
            throw new AppException("Người phụ trách không hợp lệ.", 400, "INVALID_ASSIGNEE");
        }

        Guid? distributorId = request.DistributorId;
        if (!distributorId.HasValue && !string.IsNullOrWhiteSpace(request.DistributorName))
        {
            distributorId = await _repository.GetOrCreateDistributorAsync(null, request.DistributorName, request.IsDemo, ct);
        }

        var contract = new FilmContractEntity
        {
            ContractId = Guid.NewGuid(),
            InternalCode = await _repository.NextContractCodeAsync(ct),
            CounterpartyContractNumber = Trim(request.CounterpartyContractNumber, 100),
            DistributorId = distributorId,
            AssignedMovieManagerId = assigneeId,
            TemplateId = request.TemplateId,
            CreatedByUserId = userId,
            Status = ContractStatus.Draft,
            CurrentRevisionNumber = 1
        };

        var revision = new ContractRevisionEntity
        {
            ContractRevisionId = Guid.NewGuid(),
            Contract = contract,
            RevisionNumber = 1,
            CreatedByUserId = userId
        };

        await _repository.AddContractAsync(contract, revision, ct);
        return (contract.ContractId, contract.InternalCode);
    }

    private static string? Trim(string? value, int max)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var trimmed = value.Trim();
        return trimmed.Length <= max ? trimmed : trimmed[..max];
    }
}
