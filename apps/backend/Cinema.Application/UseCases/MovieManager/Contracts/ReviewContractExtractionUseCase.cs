using System.Text.Json;
using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Entities.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.Contracts;

public class ReviewContractExtractionUseCase
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public ReviewContractExtractionUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<(bool DataReviewed, bool FinancialPolicyReviewed)> ExecuteAsync(
        Guid contractId, ReviewExtractionReqDto request, CancellationToken ct)
    {
        var userId = _userContext.GetUserId();
        var isAdmin = _userContext.IsInRole("Admin");

        var contract = await _repository.GetEditableContractAsync(contractId, userId, isAdmin, ct);
        if (contract == null)
            throw new AppException("Không tìm thấy hợp đồng.", 404, "CONTRACT_NOT_FOUND");
        if (contract.Status != ContractStatus.Draft)
            throw new AppException("Hồ sơ đã khóa.", 409, "CONTRACT_STATE_CONFLICT");
        if (contract.ProcessingStatus is ContractProcessingStatus.Queued or ContractProcessingStatus.Processing)
            throw new AppException("Chờ OCR hoàn tất trước khi đối soát.", 409, "CONTRACT_PROCESSING");

        var revision = await _repository.GetCurrentRevisionAsync(contractId, ct);
        if (revision == null)
            throw new AppException("Không tìm thấy revision hiện tại.", 404, "REVISION_NOT_FOUND");

        var newLines = request.MovieLines.Select(line => new ContractMovieLineEntity
        {
            ContractMovieLineId = Guid.NewGuid(),
            ContractRevisionId = revision.ContractRevisionId,
            MovieId = line.MovieId,
            VietnameseTitle = line.VietnameseTitle.Trim(),
            EnglishTitle = Trim(line.EnglishTitle, 200),
            Description = line.Description ?? "",
            PosterUrl = Trim(line.PosterUrl, 2048),
            TrailerUrl = Trim(line.TrailerUrl, 2048),
            Director = Trim(line.Director, 200),
            Actors = Trim(line.Actors, 500),
            DurationMinutes = line.DurationMinutes,
            MovieRequiredAgeId = line.MovieRequiredAgeId,
            LicenseStartAt = DateTime.SpecifyKind(line.LicenseStartAt, DateTimeKind.Utc),
            LicenseEndAt = DateTime.SpecifyKind(line.LicenseEndAt, DateTimeKind.Utc),
            CinemaScopeState = line.CinemaScopeState,
            FormatScopeState = line.FormatScopeState,
            CinemaIdsJson = JsonSerializer.Serialize(line.CinemaIds.Distinct(), JsonOptions),
            FormatIdsJson = JsonSerializer.Serialize(line.FormatIds.Distinct(), JsonOptions),
            CinemaSharePercent = line.CinemaSharePercent,
            DistributorSharePercent = line.DistributorSharePercent,
            RevenueBasis = line.RevenueBasis?.Trim() ?? "TICKET_FINAL_PRICE_AFTER_REFUND",
            SettlementCycle = line.SettlementCycle,
            Reviewed = line.Reviewed
        }).ToList();

        await using var transaction = await _repository.BeginTransactionAsync(ct);
        await _repository.ReplaceMovieLinesAsync(revision.ContractRevisionId, newLines, ct);

        ContractReviewHistory.Append(revision, userId, "REVIEW", request, _userContext.GetUserName());
        if (!string.IsNullOrWhiteSpace(request.DistributorName))
            contract.DistributorId = await _repository.GetOrCreateDistributorAsync(null, request.DistributorName, false, ct);
        revision.DataReviewed = request.MovieLines.Count > 0 && request.MovieLines.All(x => x.Reviewed);
        revision.FinancialPolicyReviewed = request.FinancialPolicyReviewed;
        contract.ProcessingStatus = ContractProcessingStatus.AwaitingDataApproval;
        contract.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return (revision.DataReviewed, revision.FinancialPolicyReviewed);
    }

    private static string? Trim(string? value, int max)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var trimmed = value.Trim();
        return trimmed.Length <= max ? trimmed : trimmed[..max];
    }
}
