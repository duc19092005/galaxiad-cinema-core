using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.ContractTemplates;

public class PublishContractTemplateUseCase
{
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public PublishContractTemplateUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<string> ExecuteAsync(Guid id, CancellationToken ct)
    {
        if (!_userContext.IsInRole("Admin"))
            throw new AppException("Chỉ Admin mới có quyền phát hành mẫu hợp đồng.", 403, "FORBIDDEN");

        var item = await _repository.GetTemplateByIdAsync(id, ct);
        if (item == null)
            throw new AppException("Không tìm thấy mẫu hợp đồng.", 404, "TEMPLATE_NOT_FOUND");

        if (item.Status != ContractTemplateStatus.Draft)
            throw new AppException("Chỉ mẫu ở trạng thái DRAFT mới được phát hành.", 409, "CONTRACT_STATE_CONFLICT");

        item.Status = ContractTemplateStatus.Published;
        item.PublishedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync(ct);
        return ContractTemplateStatus.Published.ToString();
    }
}
