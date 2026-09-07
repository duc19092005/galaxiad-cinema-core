using System.Text.Json;
using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Entities.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.Contracts;

public class GetContractDetailUseCase
{
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public GetContractDetailUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<ResContractDetailDto> ExecuteAsync(Guid contractId, CancellationToken ct)
    {
        var userId = _userContext.GetUserId();
        var isAdmin = _userContext.IsInRole("Admin");

        var item = await _repository.GetContractDetailAsync(contractId, userId, isAdmin, ct);
        if (item == null)
        {
            throw new AppException("Không tìm thấy hợp đồng trong phạm vi được giao.", 404, "CONTRACT_NOT_FOUND");
        }

        var revision = item.Revisions.SingleOrDefault();

        return new ResContractDetailDto
        {
            ContractId = item.ContractId,
            InternalCode = item.InternalCode,
            CounterpartyContractNumber = item.CounterpartyContractNumber,
            DistributorId = item.DistributorId,
            DistributorName = item.Distributor?.LegalName,
            AssignedMovieManagerId = item.AssignedMovieManagerId,
            AssignedMovieManagerName = item.AssignedMovieManager?.UserName,
            TemplateId = item.TemplateId,
            TemplateName = item.Template?.Name,
            Status = item.Status.ToString(),
            ProcessingStatus = item.ProcessingStatus.ToString(),
            CurrentRevisionNumber = item.CurrentRevisionNumber,
            Revision = revision == null ? null : new ResContractRevisionDto
            {
                ContractRevisionId = revision.ContractRevisionId,
                RevisionNumber = revision.RevisionNumber,
                ExtractedText = revision.ExtractedText,
                ExtractionJson = revision.ExtractionJson,
                ReviewHistoryJson = revision.ReviewedDataJson,
                DataReviewed = revision.DataReviewed,
                FinancialPolicyReviewed = revision.FinancialPolicyReviewed,
                Documents = revision.Documents.Select(d => new ResContractDocumentDto(
                    d.ContractDocumentId,
                    d.FileName,
                    d.Kind.ToString(),
                    d.ContentType,
                    d.FileSize,
                    d.Sha256,
                    d.UploadedAt)),
                MovieLines = revision.MovieLines.Select(l => new ResContractMovieLineDto
                {
                    ContractMovieLineId = l.ContractMovieLineId,
                    MovieId = l.MovieId,
                    VietnameseTitle = l.VietnameseTitle,
                    EnglishTitle = l.EnglishTitle,
                    Description = l.Description,
                    PosterUrl = l.PosterUrl,
                    TrailerUrl = l.TrailerUrl,
                    Director = l.Director,
                    Actors = l.Actors,
                    DurationMinutes = l.DurationMinutes,
                    MovieRequiredAgeId = l.MovieRequiredAgeId,
                    LicenseStartAt = l.LicenseStartAt,
                    LicenseEndAt = l.LicenseEndAt,
                    CinemaScopeState = l.CinemaScopeState.ToString(),
                    FormatScopeState = l.FormatScopeState.ToString(),
                    CinemaIds = ParseIds(l.CinemaIdsJson),
                    FormatIds = ParseIds(l.FormatIdsJson),
                    CinemaSharePercent = l.CinemaSharePercent,
                    DistributorSharePercent = l.DistributorSharePercent,
                    RevenueBasis = l.RevenueBasis,
                    SettlementCycle = l.SettlementCycle.ToString(),
                    Reviewed = l.Reviewed
                })
            },
            AllowedActions = GetAllowedActions(item, isAdmin)
        };
    }

    private static List<Guid> ParseIds(string json)
    {
        try { return JsonSerializer.Deserialize<List<Guid>>(json) ?? []; }
        catch { return []; }
    }

    private static string[] GetAllowedActions(FilmContractEntity contract, bool isAdmin)
    {
        var actions = new List<string>();
        if (contract.Status == ContractStatus.Draft)
        {
            actions.Add("UPLOAD_DOCUMENT");
            actions.Add("TRIGGER_EXTRACTION");
            actions.Add("REVIEW_DATA");
            actions.Add(isAdmin ? "APPROVE_CONTRACT" : "SUBMIT_FOR_REVIEW");
            if (isAdmin) actions.Add("ASSIGN_REVIEWER");
        }
        if (isAdmin && contract.Status == ContractStatus.PendingReview)
        {
            actions.Add("APPROVE_CONTRACT");
            actions.Add("RETURN_CONTRACT");
        }
        if (isAdmin && contract.Status == ContractStatus.ReadyToSign)
        {
            actions.Add("SIGN_CONTRACT");
            actions.Add("RETURN_CONTRACT");
        }
        if (isAdmin && contract.Status == ContractStatus.Signed)
        {
            actions.Add("ACTIVATE_CONTRACT");
            actions.Add("CREATE_ADDENDUM");
        }
        if (isAdmin && contract.Status == ContractStatus.Activated)
        {
            actions.Add("CREATE_ADDENDUM");
            actions.Add("VIEW_RECONCILIATION");
        }
        return [.. actions];
    }
}
