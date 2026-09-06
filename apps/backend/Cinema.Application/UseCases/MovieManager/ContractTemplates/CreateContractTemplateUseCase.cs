using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Entities.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.ContractTemplates;

public class CreateContractTemplateUseCase
{
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public CreateContractTemplateUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<ResContractTemplateDto> ExecuteAsync(CreateContractTemplateReqDto request, CancellationToken ct)
    {
        if (!_userContext.IsInRole("Admin"))
            throw new AppException("Chỉ Admin mới có quyền tạo mẫu hợp đồng.", 403, "FORBIDDEN");

        var code = request.Code.Trim().ToUpperInvariant();
        var nextVersion = await _repository.GetNextTemplateVersionAsync(code, ct);

        var item = new ContractTemplateEntity
        {
            ContractTemplateId = Guid.NewGuid(),
            Code = code,
            Name = request.Name.Trim(),
            Version = nextVersion,
            SchemaJson = request.SchemaJson,
            BodyTemplate = request.BodyTemplate,
            CreatedByUserId = _userContext.GetUserId(),
            Status = ContractTemplateStatus.Draft
        };

        await _repository.AddTemplateAsync(item, ct);

        return new ResContractTemplateDto(
            item.ContractTemplateId,
            item.Code,
            item.Name,
            item.Version,
            item.Status.ToString(),
            item.SchemaJson,
            item.BodyTemplate,
            item.CreatedAt,
            item.PublishedAt);
    }
}
