using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;

namespace Cinema.Application.UseCases.MovieManager.Contracts;

public class DownloadContractDocumentUseCase
{
    private readonly IContractRepository _repository;
    private readonly IContractObjectStorage _storage;
    private readonly IUserContextService _userContext;

    public DownloadContractDocumentUseCase(
        IContractRepository repository,
        IContractObjectStorage storage,
        IUserContextService userContext)
    {
        _repository = repository;
        _storage = storage;
        _userContext = userContext;
    }

    public async Task<(byte[] Content, string ContentType, string FileName)> ExecuteAsync(
        Guid contractId, Guid documentId, CancellationToken ct)
    {
        var userId = _userContext.GetUserId();
        var isAdmin = _userContext.IsInRole("Admin");

        var contract = await _repository.GetContractDetailAsync(contractId, userId, isAdmin, ct);
        if (contract == null)
            throw new AppException("Không tìm thấy hợp đồng.", 404, "CONTRACT_NOT_FOUND");

        var document = await _repository.GetDocumentByIdAsync(contractId, documentId, ct);
        if (document == null)
            throw new AppException("Không tìm thấy tài liệu.", 404, "DOCUMENT_NOT_FOUND");

        var content = await _storage.GetAsync(document.StoragePath, ct);
        if (content == null)
            throw new AppException("Không tìm thấy nội dung file trên kho lưu trữ.", 404, "FILE_NOT_FOUND");

        return (content, document.ContentType, document.FileName);
    }
}
