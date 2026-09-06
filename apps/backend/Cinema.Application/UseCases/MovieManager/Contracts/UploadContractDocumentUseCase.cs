using System.Security.Cryptography;
using Cinema.Application.Dtos.Common;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Entities.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.Contracts;

public class UploadContractDocumentUseCase
{
    private readonly IContractRepository _repository;
    private readonly IContractObjectStorage _storage;
    private readonly IUserContextService _userContext;

    public UploadContractDocumentUseCase(
        IContractRepository repository,
        IContractObjectStorage storage,
        IUserContextService userContext)
    {
        _repository = repository;
        _storage = storage;
        _userContext = userContext;
    }

    public async Task<(Guid DocumentId, string FileName, string Sha256)> ExecuteAsync(
        Guid contractId, FileUploadModel file, ContractDocumentKind kind, CancellationToken ct)
    {
        var userId = _userContext.GetUserId();
        var isAdmin = _userContext.IsInRole("Admin");

        var contract = await _repository.GetEditableContractAsync(contractId, userId, isAdmin, ct);
        if (contract == null)
            throw new AppException("Không tìm thấy hồ sơ được giao.", 404, "CONTRACT_NOT_FOUND");
        if (contract.Status != ContractStatus.Draft)
            throw new AppException("Chỉ hồ sơ DRAFT mới được upload.", 409, "CONTRACT_STATE_CONFLICT");
        if (file.Length is <= 0 or > 25 * 1024 * 1024)
            throw new AppException("File phải từ 1 byte đến 25 MB.", 400, "CONTRACT_FILE_SIZE");

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension is not (".pdf" or ".png" or ".jpg" or ".jpeg"))
            throw new AppException("Chỉ chấp nhận PDF, PNG hoặc JPEG.", 400, "CONTRACT_FILE_TYPE");

        await using var buffered = new MemoryStream();
        await file.Stream.CopyToAsync(buffered, ct);
        var bytes = buffered.ToArray();

        var header = new byte[Math.Min(8, bytes.Length)];
        Array.Copy(bytes, header, header.Length);

        if (!MatchesSignature(extension, header))
            throw new AppException("Nội dung file không khớp phần mở rộng.", 400, "CONTRACT_FILE_SIGNATURE");

        var revision = await _repository.GetCurrentRevisionAsync(contractId, ct);
        if (revision == null)
            throw new AppException("Không tìm thấy revision hiện tại.", 404, "REVISION_NOT_FOUND");

        var documentId = Guid.NewGuid();
        var sha = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
        var objectKey = $"{contractId:N}/{revision.ContractRevisionId:N}/{documentId:N}{extension}";
        var contentType = ContentTypeFor(extension);

        await using var uploadStream = new MemoryStream(bytes, writable: false);
        await _storage.PutAsync(objectKey, uploadStream, bytes.LongLength, contentType, ct);

        var document = new ContractDocumentEntity
        {
            ContractDocumentId = documentId,
            ContractRevisionId = revision.ContractRevisionId,
            Kind = kind,
            FileName = Path.GetFileName(file.FileName),
            ContentType = contentType,
            StoragePath = objectKey,
            Sha256 = sha,
            FileSize = file.Length,
            UploadedByUserId = userId
        };

        await _repository.AddDocumentAsync(document, ct);
        contract.UpdatedAt = DateTime.UtcNow;
        await _repository.SaveChangesAsync(ct);

        return (documentId, document.FileName, sha);
    }

    private static bool MatchesSignature(string ext, byte[] header)
    {
        if (ext == ".pdf" && header.Length >= 4 &&
            header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46) return true;
        if (ext == ".png" && header.Length >= 8 &&
            header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47 &&
            header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A) return true;
        if (ext is ".jpg" or ".jpeg" && header.Length >= 3 &&
            header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF) return true;
        return false;
    }

    private static string ContentTypeFor(string ext) => ext switch
    {
        ".pdf" => "application/pdf",
        ".png" => "image/png",
        ".jpg" or ".jpeg" => "image/jpeg",
        _ => "application/octet-stream"
    };
}
