using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Application.Interfaces.IIdentityAccess;
using Cinema.Domain.Entities.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.Contracts;

public class SignContractUseCase
{
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;
    private readonly IPasswordHasher _passwordHasher;

    public SignContractUseCase(
        IContractRepository repository,
        IUserContextService userContext,
        IPasswordHasher passwordHasher)
    {
        _repository = repository;
        _userContext = userContext;
        _passwordHasher = passwordHasher;
    }

    public async Task<(int RevisionNumber, string ContentHash)> ExecuteAsync(Guid contractId, SignContractReqDto request, CancellationToken ct)
    {
        if (!_userContext.IsInRole("Admin"))
            throw new AppException("Chỉ Admin mới có quyền ký hợp đồng.", 403, "FORBIDDEN");

        var userId = _userContext.GetUserId();
        var signerPasswordHash = await _repository.GetUserPasswordHashAsync(userId, ct);
        if (string.IsNullOrWhiteSpace(request.Password) || !_passwordHasher.Validate(signerPasswordHash, request.Password))
            throw new AppException("Mật khẩu xác nhận không đúng.", 401, "SIGN_PASSWORD_INVALID");

        var contract = await _repository.GetContractByIdAsync(contractId, ct);
        if (contract == null)
            throw new AppException("Không tìm thấy hợp đồng.", 404, "CONTRACT_NOT_FOUND");

        if (contract.Status != ContractStatus.ReadyToSign)
            throw new AppException("Hợp đồng chưa sẵn sàng ký.", 409, "CONTRACT_STATE_CONFLICT");

        var revision = await _repository.GetCurrentRevisionAsync(contractId, ct);
        if (revision == null)
            throw new AppException("Không tìm thấy revision hợp đồng.", 404, "REVISION_NOT_FOUND");

        revision.ContentHash = ContractRevisionValidator.Hash(revision);

        if (await _repository.HasSignOffAsync(contractId, revision.ContractRevisionId, ct))
            throw new AppException("Revision này đã được ký.", 409, "CONTRACT_ALREADY_SIGNED");

        var signOff = new ContractSignOffEntity
        {
            ContractSignOffId = Guid.NewGuid(),
            ContractId = contractId,
            ContractRevisionId = revision.ContractRevisionId,
            SignedByUserId = userId,
            SignedAt = DateTime.UtcNow,
            SignedContentHash = revision.ContentHash,
            IsInternalApproval = true
        };
        await _repository.AddSignOffAsync(signOff, ct);

        contract.Status = ContractStatus.Signed;
        contract.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync(ct);
        return (revision.RevisionNumber, revision.ContentHash);
    }
}
