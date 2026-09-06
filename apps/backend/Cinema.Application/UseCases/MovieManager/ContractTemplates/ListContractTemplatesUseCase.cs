using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;

namespace Cinema.Application.UseCases.MovieManager.ContractTemplates;

public class ListContractTemplatesUseCase
{
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public ListContractTemplatesUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<List<ResContractTemplateDto>> ExecuteAsync(CancellationToken ct)
    {
        var isAdmin = _userContext.IsInRole("Admin");
        var list = await _repository.ListTemplatesAsync(isAdmin, ct);

        return list.Select(x => new ResContractTemplateDto(
            x.ContractTemplateId,
            x.Code,
            x.Name,
            x.Version,
            x.Status.ToString(),
            x.SchemaJson,
            x.BodyTemplate,
            x.CreatedAt,
            x.PublishedAt
        )).ToList();
    }
}
