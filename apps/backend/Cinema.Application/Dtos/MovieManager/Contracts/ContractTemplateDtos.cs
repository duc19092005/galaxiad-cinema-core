namespace Cinema.Application.Dtos.MovieManager.Contracts;

public sealed record CreateContractTemplateReqDto(string Code, string Name, string SchemaJson, string BodyTemplate);
public sealed record UpdateContractTemplateReqDto(string Name, string SchemaJson, string BodyTemplate);

public sealed record ResContractTemplateDto(
    Guid ContractTemplateId,
    string Code,
    string Name,
    int Version,
    string Status,
    string SchemaJson,
    string BodyTemplate,
    DateTime CreatedAt,
    DateTime? PublishedAt);
