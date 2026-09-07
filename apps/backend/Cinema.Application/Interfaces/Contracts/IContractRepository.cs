using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Domain.Entities.Contracts;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.Interfaces.Contracts;

public interface IContractRepository
{
    Task<List<ContractReviewerDto>> ListReviewersAsync(CancellationToken ct);
    Task<List<FilmContractEntity>> ListContractsAsync(ContractStatus? status, Guid userId, bool isAdmin, CancellationToken ct);
    Task<FilmContractEntity?> GetContractDetailAsync(Guid contractId, Guid userId, bool isAdmin, CancellationToken ct);
    Task<FilmContractEntity?> GetEditableContractAsync(Guid contractId, Guid userId, bool isAdmin, CancellationToken ct);
    Task<FilmContractEntity?> GetContractByIdAsync(Guid contractId, CancellationToken ct);
    Task<ContractRevisionEntity?> GetCurrentRevisionAsync(Guid contractId, CancellationToken ct);
    Task<ContractDocumentEntity?> GetDocumentByIdAsync(Guid contractId, Guid documentId, CancellationToken ct);
    Task<string> NextContractCodeAsync(CancellationToken ct);
    Task<bool> CanAssignUserAsync(Guid userId, CancellationToken ct);
    Task<Guid> GetOrCreateDistributorAsync(Guid? distributorId, string? distributorName, bool isDemo, CancellationToken ct);
    Task AddContractAsync(FilmContractEntity contract, ContractRevisionEntity revision, CancellationToken ct);
    Task AddDocumentAsync(ContractDocumentEntity document, CancellationToken ct);
    Task ReplaceMovieLinesAsync(Guid contractRevisionId, List<ContractMovieLineEntity> newLines, CancellationToken ct);
    Task<bool> HasSignOffAsync(Guid contractId, Guid revisionId, CancellationToken ct);
    Task<ContractSignOffEntity?> GetSignOffAsync(Guid contractId, Guid revisionId, CancellationToken ct);
    Task AddSignOffAsync(ContractSignOffEntity signOff, CancellationToken ct);
    Task<string> GetUserPasswordHashAsync(Guid userId, CancellationToken ct);
    Task<MovieInfoEntity?> GetMovieByIdAsync(Guid movieId, CancellationToken ct);
    Task AddMovieAsync(MovieInfoEntity movie, CancellationToken ct);
    Task<bool> ExhibitionRightExistsAsync(Guid contractId, Guid contractMovieLineId, CancellationToken ct);
    Task AddExhibitionRightsAsync(IEnumerable<ExhibitionRightEntity> rights, CancellationToken ct);
    Task EnsureCatalogRelationsAsync(Guid movieId, ContractMovieLineEntity line, CancellationToken ct);
    Task SetExhibitionRightsActiveStateAsync(Guid contractId, bool isActive, bool checkEndsAt, CancellationToken ct);
    Task AddAddendumRevisionAsync(Guid contractId, ContractRevisionEntity revision, CancellationToken ct);
    Task<List<TicketRevenueSnapshotEntity>> GetReconciliationSnapshotsAsync(Guid contractId, DateTime? from, DateTime? to, CancellationToken ct);
    Task<FilmContractEntity?> GetContractForReconciliationAsync(Guid contractId, CancellationToken ct);
    Task<List<MovieRevenueReportRowDto>> GetMovieRevenueReportRowsAsync(DateTime start, DateTime end, CancellationToken ct);

    // Templates
    Task<List<ContractTemplateEntity>> ListTemplatesAsync(bool isAdmin, CancellationToken ct);
    Task<ContractTemplateEntity?> GetTemplateByIdAsync(Guid id, CancellationToken ct);
    Task<int> GetNextTemplateVersionAsync(string code, CancellationToken ct);
    Task AddTemplateAsync(ContractTemplateEntity template, CancellationToken ct);

    // Movie Change Requests
    Task AddMovieChangeRequestAsync(MovieChangeRequestEntity item, CancellationToken ct);
    Task<List<MovieChangeRequestEntity>> ListMovieChangeRequestsAsync(Guid movieId, Guid userId, bool isAdmin, CancellationToken ct);
    Task<MovieChangeRequestEntity?> GetMovieChangeRequestOwnedAsync(Guid id, Guid userId, bool isAdmin, CancellationToken ct);
    Task<MovieChangeRequestEntity?> GetMovieChangeRequestByIdAsync(Guid id, CancellationToken ct);
    Task ApplyApprovedMovieChangesAsync(Guid movieId, Dictionary<string, string> changes, Guid reviewedByUserId, CancellationToken ct);

    Task SaveChangesAsync(CancellationToken ct);
    Task<IUnitOfWorkTransaction> BeginTransactionAsync(CancellationToken ct);
}
