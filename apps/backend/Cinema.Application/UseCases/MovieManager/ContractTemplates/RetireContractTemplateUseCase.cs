using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.ContractTemplates;

public class RetireContractTemplateUseCase
{
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public RetireContractTemplateUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<string> ExecuteAsync(Guid id, CancellationToken ct)
    {
        if (!_userContext.IsInRole("Admin"))
            throw new AppException("Chỉ Admin mới có quyền thu hồi mẫu hợp đồng.", 403, "FORBIDDEN");

        var item = await _repository.GetTemplateByIdAsync(id, ct);
        if (item == null)
            throw new AppException("Không tìm thấy mẫu hợp đồng.", 404, "TEMPLATE_NOT_FOUND");

        item.Status = ContractTemplateStatus.Retired;

        await _repository.SaveChangesAsync(ct);
        return ContractTemplateStatus.Retired.ToString();
    }
}
