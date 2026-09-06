using System.Globalization;
using System.Text.Json;
using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Entities.Contracts;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Persistence.Repositories.Contracts;

public class ContractRepository : IContractRepository
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly CinemaDbContext _db;

    public ContractRepository(CinemaDbContext db)
    {
        _db = db;
    }

    private IQueryable<FilmContractEntity> Scope(Guid userId, bool isAdmin)
    {
        var query = _db.FilmContractEntity.AsQueryable();
        return isAdmin ? query : query.Where(x => x.AssignedMovieManagerId == userId);
    }

    public async Task<List<FilmContractEntity>> ListContractsAsync(ContractStatus? status, Guid userId, bool isAdmin, CancellationToken ct)
    {
        var query = Scope(userId, isAdmin).AsNoTracking();
        if (status.HasValue) query = query.Where(x => x.Status == status);
        return await query.OrderByDescending(x => x.UpdatedAt)
            .Include(x => x.Distributor)
            .Include(x => x.AssignedMovieManager)
            .ToListAsync(ct);
    }

    public async Task<FilmContractEntity?> GetContractDetailAsync(Guid contractId, Guid userId, bool isAdmin, CancellationToken ct)
    {
        return await Scope(userId, isAdmin).AsNoTracking()
            .Include(x => x.Distributor)
            .Include(x => x.Template)
            .Include(x => x.AssignedMovieManager)
            .Include(x => x.Revisions.Where(r => r.IsCurrent)).ThenInclude(r => r.Documents)
            .Include(x => x.Revisions.Where(r => r.IsCurrent)).ThenInclude(r => r.MovieLines)
            .SingleOrDefaultAsync(x => x.ContractId == contractId, ct);
    }

    public async Task<FilmContractEntity?> GetEditableContractAsync(Guid contractId, Guid userId, bool isAdmin, CancellationToken ct)
    {
        return await Scope(userId, isAdmin).SingleOrDefaultAsync(x => x.ContractId == contractId, ct);
    }

    public async Task<FilmContractEntity?> GetContractByIdAsync(Guid contractId, CancellationToken ct)
    {
        return await _db.FilmContractEntity.FindAsync([contractId], ct);
    }

    public async Task<ContractRevisionEntity?> GetCurrentRevisionAsync(Guid contractId, CancellationToken ct)
    {
        return await _db.ContractRevisionEntity
            .Include(x => x.Documents)
            .Include(x => x.MovieLines)
            .SingleOrDefaultAsync(x => x.ContractId == contractId && x.IsCurrent, ct);
    }

    public async Task<ContractDocumentEntity?> GetDocumentByIdAsync(Guid contractId, Guid documentId, CancellationToken ct)
    {
        return await _db.ContractDocumentEntity.AsNoTracking()
            .SingleOrDefaultAsync(x => x.ContractDocumentId == documentId && x.Revision.ContractId == contractId, ct);
    }

    public async Task<string> NextContractCodeAsync(CancellationToken ct)
    {
        var year = DateTime.UtcNow.Year;
        var number = await _db.FilmContractEntity.CountAsync(x => x.CreatedAt.Year == year, ct) + 1;
        var code = $"HD-{year}-{number:D4}";
        while (await _db.FilmContractEntity.AnyAsync(x => x.InternalCode == code, ct))
        {
            number++;
            code = $"HD-{year}-{number:D4}";
        }
        return code;
    }

    public async Task<bool> CanAssignUserAsync(Guid userId, CancellationToken ct)
    {
        return await _db.UserRoleInfoEntity.AnyAsync(x => x.UserId == userId &&
            (x.RoleListInfoEntity.RoleName == "MovieManager" || x.RoleListInfoEntity.RoleName == "Admin"), ct);
    }

    public async Task<Guid> GetOrCreateDistributorAsync(Guid? distributorId, string? distributorName, bool isDemo, CancellationToken ct)
    {
        if (distributorId.HasValue) return distributorId.Value;
        var distributor = new DistributorEntity
        {
            DistributorId = Guid.NewGuid(),
            LegalName = (distributorName ?? "Unknown").Trim(),
            IsDemo = isDemo
        };
        _db.DistributorEntity.Add(distributor);
        await _db.SaveChangesAsync(ct);
        return distributor.DistributorId;
    }

    public async Task AddContractAsync(FilmContractEntity contract, ContractRevisionEntity revision, CancellationToken ct)
    {
        _db.FilmContractEntity.Add(contract);
        _db.ContractRevisionEntity.Add(revision);
        await _db.SaveChangesAsync(ct);
    }

    public async Task AddDocumentAsync(ContractDocumentEntity document, CancellationToken ct)
    {
        _db.ContractDocumentEntity.Add(document);
        await _db.SaveChangesAsync(ct);
    }

    public async Task ReplaceMovieLinesAsync(Guid contractRevisionId, List<ContractMovieLineEntity> newLines, CancellationToken ct)
    {
        var existing = await _db.ContractMovieLineEntity
            .Where(x => x.ContractRevisionId == contractRevisionId).ToListAsync(ct);
        _db.ContractMovieLineEntity.RemoveRange(existing);
        _db.ContractMovieLineEntity.AddRange(newLines);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<bool> HasSignOffAsync(Guid contractId, Guid revisionId, CancellationToken ct)
    {
        return await _db.ContractSignOffEntity.AnyAsync(x =>
            x.ContractId == contractId && x.ContractRevisionId == revisionId, ct);
    }

    public async Task<ContractSignOffEntity?> GetSignOffAsync(Guid contractId, Guid revisionId, CancellationToken ct)
    {
        return await _db.ContractSignOffEntity.AsNoTracking().SingleOrDefaultAsync(x =>
            x.ContractId == contractId && x.ContractRevisionId == revisionId, ct);
    }

    public async Task AddSignOffAsync(ContractSignOffEntity signOff, CancellationToken ct)
    {
        _db.ContractSignOffEntity.Add(signOff);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<string> GetUserPasswordHashAsync(Guid userId, CancellationToken ct)
    {
        return await _db.UserInfoEntity.AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => x.Password)
            .SingleAsync(ct);
    }

    public async Task<MovieInfoEntity?> GetMovieByIdAsync(Guid movieId, CancellationToken ct)
    {
        return await _db.MovieInfoEntity.FindAsync([movieId], ct);
    }

    public async Task AddMovieAsync(MovieInfoEntity movie, CancellationToken ct)
    {
        _db.MovieInfoEntity.Add(movie);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<bool> ExhibitionRightExistsAsync(Guid contractId, Guid contractMovieLineId, CancellationToken ct)
    {
        return await _db.ExhibitionRightEntity.AnyAsync(x =>
            x.ContractId == contractId && x.ContractMovieLineId == contractMovieLineId, ct);
    }

    public async Task AddExhibitionRightsAsync(IEnumerable<ExhibitionRightEntity> rights, CancellationToken ct)
    {
        _db.ExhibitionRightEntity.AddRange(rights);
        await _db.SaveChangesAsync(ct);
    }

    public async Task EnsureCatalogRelationsAsync(Guid movieId, ContractMovieLineEntity line, CancellationToken ct)
    {
        var cinemas = line.CinemaScopeState == ContractScopeState.Specified
            ? ParseIds(line.CinemaIdsJson)
            : await _db.CinemaInfoEntity.Select(x => x.CinemaId).ToListAsync(ct);
        var formats = line.FormatScopeState == ContractScopeState.Specified
            ? ParseIds(line.FormatIdsJson)
            : await _db.MovieFormatInfoEntity.Select(x => x.MovieFormatId).ToListAsync(ct);
        var existingCinemas = await _db.MovieCinemaEntities.Where(x => x.MovieId == movieId)
            .Select(x => x.CinemaId).ToListAsync(ct);
        var existingFormats = await _db.MovieFormatMovieInfoEntity.Where(x => x.MovieId == movieId)
            .Select(x => x.FormatId).ToListAsync(ct);
        _db.MovieCinemaEntities.AddRange(cinemas.Except(existingCinemas)
            .Select(cinemaId => new MovieCinemaEntity { MovieId = movieId, CinemaId = cinemaId }));
        _db.MovieFormatMovieInfoEntity.AddRange(formats.Except(existingFormats)
            .Select(formatId => new movieFormatMovieInfoEntity { MovieId = movieId, FormatId = formatId }));
        await _db.SaveChangesAsync(ct);
    }

    public async Task SetExhibitionRightsActiveStateAsync(Guid contractId, bool isActive, bool checkEndsAt, CancellationToken ct)
    {
        var rights = await _db.ExhibitionRightEntity.Where(x => x.ContractId == contractId).ToListAsync(ct);
        var now = DateTime.UtcNow;
        foreach (var r in rights)
        {
            r.IsActive = isActive && (!checkEndsAt || r.EndsAt >= now);
        }
        await _db.SaveChangesAsync(ct);
    }

    public async Task AddAddendumRevisionAsync(Guid contractId, ContractRevisionEntity revision, CancellationToken ct)
    {
        var existingCurrent = await _db.ContractRevisionEntity
            .Where(x => x.ContractId == contractId && x.IsCurrent).ToListAsync(ct);
        foreach (var r in existingCurrent) r.IsCurrent = false;
        _db.ContractRevisionEntity.Add(revision);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<TicketRevenueSnapshotEntity>> GetReconciliationSnapshotsAsync(Guid contractId, DateTime? from, DateTime? to, CancellationToken ct)
    {
        var query = _db.TicketRevenueSnapshotEntity.AsNoTracking().Where(x => x.ContractId == contractId);
        if (from.HasValue) query = query.Where(x => x.ShowtimeAt >= from.Value);
        if (to.HasValue) query = query.Where(x => x.ShowtimeAt <= to.Value);
        return await query.OrderByDescending(x => x.ShowtimeAt).ToListAsync(ct);
    }

    public async Task<FilmContractEntity?> GetContractForReconciliationAsync(Guid contractId, CancellationToken ct)
    {
        return await _db.FilmContractEntity.AsNoTracking()
            .Include(x => x.Distributor)
            .SingleOrDefaultAsync(x => x.ContractId == contractId, ct);
    }

    public async Task<List<MovieRevenueReportRowDto>> GetMovieRevenueReportRowsAsync(DateTime start, DateTime end, CancellationToken ct)
    {
        var query = from snapshot in _db.TicketRevenueSnapshotEntity.AsNoTracking()
                    join movie in _db.MovieInfoEntity.AsNoTracking() on snapshot.MovieId equals movie.MovieId
                    join contract in _db.FilmContractEntity.AsNoTracking() on snapshot.ContractId equals contract.ContractId
                    join distributor in _db.DistributorEntity.AsNoTracking() on contract.DistributorId equals distributor.DistributorId into distributors
                    from distributor in distributors.DefaultIfEmpty()
                    where snapshot.ShowtimeAt >= start && snapshot.ShowtimeAt <= end
                    group snapshot by new { snapshot.MovieId, movie.MovieName, snapshot.ContractId, contract.InternalCode, DistributorName = distributor == null ? null : distributor.LegalName } into grouped
                    select new MovieRevenueReportRowDto(
                        grouped.Key.MovieId,
                        grouped.Key.MovieName,
                        grouped.Key.ContractId,
                        grouped.Key.InternalCode,
                        grouped.Key.DistributorName,
                        grouped.Count(),
                        grouped.Sum(x => x.TicketNetAmount - x.RefundedAmount),
                        grouped.Sum(x => x.RevenueBasisAmount),
                        grouped.Sum(x => x.CinemaShareAmount),
                        grouped.Sum(x => x.DistributorShareAmount));

        return await query.OrderByDescending(x => x.CinemaShare).ThenByDescending(x => x.TicketRevenue).ToListAsync(ct);
    }

    private static List<Guid> ParseIds(string json)
    {
        try { return JsonSerializer.Deserialize<List<Guid>>(json, JsonOptions) ?? []; }
        catch { return []; }
    }

    // Templates
    public async Task<List<ContractTemplateEntity>> ListTemplatesAsync(bool isAdmin, CancellationToken ct)
    {
        var query = _db.ContractTemplateEntity.AsNoTracking();
        if (!isAdmin) query = query.Where(x => x.Status == ContractTemplateStatus.Published);
        return await query.OrderBy(x => x.Code).ThenByDescending(x => x.Version).ToListAsync(ct);
    }

    public async Task<ContractTemplateEntity?> GetTemplateByIdAsync(Guid id, CancellationToken ct)
    {
        return await _db.ContractTemplateEntity.FindAsync([id], ct);
    }

    public async Task<int> GetNextTemplateVersionAsync(string code, CancellationToken ct)
    {
        return (await _db.ContractTemplateEntity.Where(x => x.Code == code).MaxAsync(x => (int?)x.Version, ct) ?? 0) + 1;
    }

    public async Task AddTemplateAsync(ContractTemplateEntity template, CancellationToken ct)
    {
        _db.ContractTemplateEntity.Add(template);
        await _db.SaveChangesAsync(ct);
    }

    // Movie Change Requests
    public async Task AddMovieChangeRequestAsync(MovieChangeRequestEntity item, CancellationToken ct)
    {
        _db.MovieChangeRequestEntity.Add(item);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<MovieChangeRequestEntity>> ListMovieChangeRequestsAsync(Guid movieId, Guid userId, bool isAdmin, CancellationToken ct)
    {
        var query = _db.MovieChangeRequestEntity.AsNoTracking().Where(x => x.MovieId == movieId);
        if (!isAdmin) query = query.Where(x => x.RequestedByUserId == userId);
        return await query.OrderByDescending(x => x.UpdatedAt).ToListAsync(ct);
    }

    public async Task<MovieChangeRequestEntity?> GetMovieChangeRequestOwnedAsync(Guid id, Guid userId, bool isAdmin, CancellationToken ct)
    {
        return await _db.MovieChangeRequestEntity.SingleOrDefaultAsync(x =>
            x.MovieChangeRequestId == id && (isAdmin || x.RequestedByUserId == userId), ct);
    }

    public async Task<MovieChangeRequestEntity?> GetMovieChangeRequestByIdAsync(Guid id, CancellationToken ct)
    {
        return await _db.MovieChangeRequestEntity.FindAsync([id], ct);
    }

    public async Task ApplyApprovedMovieChangesAsync(Guid movieId, Dictionary<string, string> changes, Guid reviewedByUserId, CancellationToken ct)
    {
        var movie = await _db.MovieInfoEntity.SingleAsync(x => x.MovieId == movieId, ct);
        foreach (var (field, text) in changes)
        {
            switch (field.ToLowerInvariant())
            {
                case "moviedescription": movie.MovieDescription = text; break;
                case "movieimageurl": movie.MovieImageUrl = text; break;
                case "moviebannerurl": movie.MovieBannerUrl = text; break;
                case "trailerurl": movie.TrailerUrl = text; break;
                case "director": movie.Director = text; break;
                case "actors": movie.Actors = text; break;
            }
        }
        movie.UpdatedAt = DateTime.UtcNow;
        movie.UpdatedByUserId = reviewedByUserId;
        await _db.SaveChangesAsync(ct);
    }

    public Task SaveChangesAsync(CancellationToken ct) => _db.SaveChangesAsync(ct);

    public async Task<IAsyncDisposable> BeginTransactionAsync(CancellationToken ct)
    {
        var tx = await _db.Database.BeginTransactionAsync(ct);
        return tx;
    }
}
