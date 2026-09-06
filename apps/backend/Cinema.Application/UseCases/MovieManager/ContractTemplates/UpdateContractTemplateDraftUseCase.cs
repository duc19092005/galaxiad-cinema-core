using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.ContractTemplates;

public class UpdateContractTemplateDraftUseCase
{
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public UpdateContractTemplateDraftUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<ResContractTemplateDto> ExecuteAsync(Guid id, UpdateContractTemplateReqDto request, CancellationToken ct)
    {
        if (!_userContext.IsInRole("Admin"))
            throw new AppException("Chỉ Admin mới có quyền sửa mẫu hợp đồng.", 403, "FORBIDDEN");

        var item = await _repository.GetTemplateByIdAsync(id, ct);
        if (item == null)
            throw new AppException("Không tìm thấy mẫu hợp đồng.", 404, "TEMPLATE_NOT_FOUND");

        if (item.Status != ContractTemplateStatus.Draft)
            throw new AppException("Mẫu đã phát hành không được sửa tại chỗ.", 409, "PUBLISHED_TEMPLATE_IMMUTABLE");

        item.Name = request.Name.Trim();
        item.SchemaJson = request.SchemaJson;
        item.BodyTemplate = request.BodyTemplate;

        await _repository.SaveChangesAsync(ct);

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
