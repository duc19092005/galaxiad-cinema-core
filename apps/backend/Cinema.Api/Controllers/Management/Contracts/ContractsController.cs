using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Cinema.Api.Services.Contracts;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.IIdentityAccess;
using Cinema.Domain.Entities.Contracts;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Enums;
using Cinema.Infrastructure;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Api.Controllers.Management.Contracts;

[ApiController]
[Route("api/contracts")]
[Authorize(Roles = "Admin,MovieManager")]
[Tags("Film contracts")]
public sealed class ContractsController : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly CinemaDbContext _db;
    private readonly IUserContextService _user;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IContractObjectStorage _storage;
    private readonly IBackgroundJobClient _jobs;

    public ContractsController(CinemaDbContext db, IUserContextService user, IPasswordHasher passwordHasher,
        IContractObjectStorage storage, IBackgroundJobClient jobs)
    {
        _db = db;
        _user = user;
        _passwordHasher = passwordHasher;
        _storage = storage;
        _jobs = jobs;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] ContractStatus? status, CancellationToken ct)
    {
        var query = Scope().AsNoTracking();
        if (status.HasValue) query = query.Where(x => x.Status == status);
        var rows = await query.OrderByDescending(x => x.UpdatedAt).Select(x => new
        {
            x.ContractId, x.InternalCode, x.CounterpartyContractNumber,
            distributorName = x.Distributor == null ? null : x.Distributor.LegalName,
            x.AssignedMovieManagerId,
            assignedMovieManagerName = x.AssignedMovieManager == null ? null : x.AssignedMovieManager.UserName,
            status = x.Status.ToString(), processingStatus = x.ProcessingStatus.ToString(),
            x.CurrentRevisionNumber, x.CreatedAt, x.UpdatedAt
        }).ToListAsync(ct);
        return Ok(Success(rows));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var item = await Scope().AsNoTracking()
            .Include(x => x.Distributor).Include(x => x.Template).Include(x => x.AssignedMovieManager)
            .Include(x => x.Revisions.Where(r => r.IsCurrent)).ThenInclude(r => r.Documents)
            .Include(x => x.Revisions.Where(r => r.IsCurrent)).ThenInclude(r => r.MovieLines)
            .SingleOrDefaultAsync(x => x.ContractId == id, ct);
        if (item == null) return NotFound(Failure("CONTRACT_NOT_FOUND", "Không tìm thấy hợp đồng trong phạm vi được giao."));
        var revision = item.Revisions.SingleOrDefault();
        return Ok(Success(new
        {
            item.ContractId, item.InternalCode, item.CounterpartyContractNumber, item.DistributorId,
            distributorName = item.Distributor?.LegalName, item.AssignedMovieManagerId,
            assignedMovieManagerName = item.AssignedMovieManager?.UserName, item.TemplateId,
            templateName = item.Template?.Name, status = item.Status.ToString(),
            processingStatus = item.ProcessingStatus.ToString(), item.CurrentRevisionNumber,
            revision = revision == null ? null : new
            {
                revision.ContractRevisionId, revision.RevisionNumber, revision.ExtractedText,
                revision.ExtractionJson, revision.DataReviewed, revision.FinancialPolicyReviewed,
                documents = revision.Documents.Select(d => new
                {
                    d.ContractDocumentId, d.FileName, kind = d.Kind.ToString(),
                    d.ContentType, d.FileSize, d.Sha256, d.UploadedAt
                }),
                movieLines = revision.MovieLines.Select(l => new
                {
                    l.ContractMovieLineId, l.MovieId, l.VietnameseTitle, l.EnglishTitle,
                    l.Description, l.PosterUrl, l.TrailerUrl, l.Director, l.Actors,
                    l.DurationMinutes, l.MovieRequiredAgeId, l.LicenseStartAt, l.LicenseEndAt,
                    cinemaScopeState = l.CinemaScopeState.ToString(),
                    formatScopeState = l.FormatScopeState.ToString(),
                    cinemaIds = ParseIds(l.CinemaIdsJson), formatIds = ParseIds(l.FormatIdsJson),
                    l.CinemaSharePercent, l.DistributorSharePercent, l.RevenueBasis,
                    settlementCycle = l.SettlementCycle.ToString(), l.Reviewed
                })
            },
            allowedActions = AllowedActions(item)
        }));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateContractRequest request, CancellationToken ct)
    {
        var userId = _user.GetUserId();
        var assigneeId = IsAdmin && request.AssignedMovieManagerId.HasValue
            ? request.AssignedMovieManagerId.Value : userId;
        var assigneeExists = await _db.UserRoleInfoEntity.AnyAsync(x => x.UserId == assigneeId &&
            (x.RoleListInfoEntity.RoleName == "MovieManager" || x.RoleListInfoEntity.RoleName == "Admin"), ct);
        if (!assigneeExists) return BadRequest(Failure("INVALID_ASSIGNEE", "Người phụ trách không hợp lệ."));

        Guid? distributorId = request.DistributorId;
        if (!distributorId.HasValue && !string.IsNullOrWhiteSpace(request.DistributorName))
        {
            var distributor = new DistributorEntity
            {
                DistributorId = Guid.NewGuid(), LegalName = request.DistributorName.Trim(),
                IsDemo = request.IsDemo
            };
            _db.DistributorEntity.Add(distributor);
            distributorId = distributor.DistributorId;
        }

        var contract = new FilmContractEntity
        {
            ContractId = Guid.NewGuid(), InternalCode = await NextCode(ct),
            CounterpartyContractNumber = Trim(request.CounterpartyContractNumber, 100),
            DistributorId = distributorId, AssignedMovieManagerId = assigneeId,
            TemplateId = request.TemplateId, CreatedByUserId = userId,
            Status = ContractStatus.Draft, CurrentRevisionNumber = 1
        };
        _db.FilmContractEntity.Add(contract);
        _db.ContractRevisionEntity.Add(new ContractRevisionEntity
        {
            ContractRevisionId = Guid.NewGuid(), Contract = contract, RevisionNumber = 1,
            CreatedByUserId = userId
        });
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = contract.ContractId },
            Success(new { id = contract.ContractId, contract.InternalCode }));
    }

    [HttpPost("{id:guid}/documents")]
    [RequestSizeLimit(25 * 1024 * 1024)]
    public async Task<IActionResult> Upload(Guid id, [FromForm] IFormFile file,
        [FromForm] ContractDocumentKind kind = ContractDocumentKind.Original, CancellationToken ct = default)
    {
        var contract = await Editable(id, ct);
        if (contract == null) return NotFound(Failure("CONTRACT_NOT_FOUND", "Không tìm thấy hồ sơ được giao."));
        if (contract.Status != ContractStatus.Draft)
            return Conflict(Failure("CONTRACT_STATE_CONFLICT", "Chỉ hồ sơ DRAFT mới được upload."));
        if (file.Length is <= 0 or > 25 * 1024 * 1024)
            return BadRequest(Failure("CONTRACT_FILE_SIZE", "File phải từ 1 byte đến 25 MB."));
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension is not (".pdf" or ".png" or ".jpg" or ".jpeg"))
            return BadRequest(Failure("CONTRACT_FILE_TYPE", "Chỉ chấp nhận PDF, PNG hoặc JPEG."));

        await using var input = file.OpenReadStream();
        var header = new byte[Math.Min(8, (int)file.Length)];
        await input.ReadExactlyAsync(header, ct);
        input.Position = 0;
        if (!MatchesSignature(extension, header))
            return BadRequest(Failure("CONTRACT_FILE_SIGNATURE", "Nội dung file không khớp phần mở rộng."));

        var revision = await _db.ContractRevisionEntity.SingleAsync(x => x.ContractId == id && x.IsCurrent, ct);
        var documentId = Guid.NewGuid();
        await using var buffered = new MemoryStream();
        await input.CopyToAsync(buffered, ct);
        var bytes = buffered.ToArray();
        var sha = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
        var objectKey = $"{id:N}/{revision.ContractRevisionId:N}/{documentId:N}{extension}";
        await using var uploadStream = new MemoryStream(bytes, writable: false);
        await _storage.PutAsync(objectKey, uploadStream, bytes.LongLength, ContentTypeFor(extension), ct);
        _db.ContractDocumentEntity.Add(new ContractDocumentEntity
        {
            ContractDocumentId = documentId, ContractRevisionId = revision.ContractRevisionId,
            Kind = kind, FileName = Path.GetFileName(file.FileName), ContentType = ContentTypeFor(extension),
            StoragePath = objectKey, Sha256 = sha, FileSize = file.Length, UploadedByUserId = _user.GetUserId()
        });
        contract.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(Success(new { documentId, fileName = Path.GetFileName(file.FileName), sha256 = sha }));
    }

    [HttpGet("{id:guid}/documents/{documentId:guid}")]
    public async Task<IActionResult> Download(Guid id, Guid documentId, CancellationToken ct)
    {
        if (!await Scope().AnyAsync(x => x.ContractId == id, ct)) return NotFound();
        var document = await _db.ContractDocumentEntity.AsNoTracking()
            .SingleOrDefaultAsync(x => x.ContractDocumentId == documentId && x.Revision.ContractId == id, ct);
        if (document == null) return NotFound();
        var content = await _storage.GetAsync(document.StoragePath, ct);
        return content == null ? NotFound() : File(content, document.ContentType, document.FileName, true);
    }

    [HttpPost("{id:guid}/extractions")]
    public async Task<IActionResult> Extract(Guid id, CancellationToken ct)
    {
        var contract = await Editable(id, ct);
        if (contract == null) return NotFound();
        if (contract.Status != ContractStatus.Draft) return Conflict(Failure("CONTRACT_STATE_CONFLICT", "Hồ sơ đã khóa."));
        var revision = await _db.ContractRevisionEntity.Include(x => x.Documents)
            .SingleAsync(x => x.ContractId == id && x.IsCurrent, ct);
        if (revision.Documents.Count == 0)
            return BadRequest(Failure("CONTRACT_DOCUMENT_REQUIRED", "Hãy upload tài liệu trước khi phân tích."));
        contract.ProcessingStatus = ContractProcessingStatus.Queued;
        await _db.SaveChangesAsync(ct);
        var jobId = _jobs.Enqueue<ContractExtractionJob>(
            job => job.RunAsync(id, revision.ContractRevisionId, CancellationToken.None));
        return Accepted(Success(new { jobId, processingStatus = "Queued" }));
    }

    [HttpPut("{id:guid}/extraction-review")]
    public async Task<IActionResult> Review(Guid id, ReviewExtractionRequest request, CancellationToken ct)
    {
        var contract = await Editable(id, ct);
        if (contract == null) return NotFound();
        if (contract.Status != ContractStatus.Draft) return Conflict(Failure("CONTRACT_STATE_CONFLICT", "Hồ sơ đã khóa."));
        var revision = await _db.ContractRevisionEntity.Include(x => x.MovieLines)
            .SingleAsync(x => x.ContractId == id && x.IsCurrent, ct);
        _db.ContractMovieLineEntity.RemoveRange(revision.MovieLines);
        foreach (var line in request.MovieLines)
        {
            _db.ContractMovieLineEntity.Add(new ContractMovieLineEntity
            {
                ContractMovieLineId = Guid.NewGuid(), ContractRevisionId = revision.ContractRevisionId,
                MovieId = line.MovieId, VietnameseTitle = line.VietnameseTitle.Trim(),
                EnglishTitle = Trim(line.EnglishTitle, 200), Description = line.Description ?? "",
                PosterUrl = Trim(line.PosterUrl, 2048), TrailerUrl = Trim(line.TrailerUrl, 2048),
                Director = Trim(line.Director, 200), Actors = Trim(line.Actors, 500),
                DurationMinutes = line.DurationMinutes, MovieRequiredAgeId = line.MovieRequiredAgeId,
                LicenseStartAt = Utc(line.LicenseStartAt), LicenseEndAt = Utc(line.LicenseEndAt),
                CinemaScopeState = line.CinemaScopeState, FormatScopeState = line.FormatScopeState,
                CinemaIdsJson = JsonSerializer.Serialize(line.CinemaIds.Distinct(), JsonOptions),
                FormatIdsJson = JsonSerializer.Serialize(line.FormatIds.Distinct(), JsonOptions),
                CinemaSharePercent = line.CinemaSharePercent,
                DistributorSharePercent = line.DistributorSharePercent,
                RevenueBasis = line.RevenueBasis?.Trim() ?? "TICKET_FINAL_PRICE_AFTER_REFUND",
                SettlementCycle = line.SettlementCycle, Reviewed = line.Reviewed
            });
        }
        revision.ReviewedDataJson = JsonSerializer.Serialize(request, JsonOptions);
        revision.DataReviewed = request.MovieLines.Count > 0 && request.MovieLines.All(x => x.Reviewed);
        revision.FinancialPolicyReviewed = request.FinancialPolicyReviewed;
        contract.ProcessingStatus = ContractProcessingStatus.AwaitingDataApproval;
        contract.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(Success(new { revision.DataReviewed, revision.FinancialPolicyReviewed }));
    }

    [HttpPost("{id:guid}/submit")]
    public async Task<IActionResult> Submit(Guid id, CancellationToken ct)
    {
        var contract = await Editable(id, ct);
        if (contract == null) return NotFound();
        if (contract.Status != ContractStatus.Draft)
            return Conflict(Failure("CONTRACT_STATE_CONFLICT", "Hồ sơ không ở trạng thái DRAFT."));
        var revision = await CurrentRevision(id, ct);
        var error = ValidateRevision(revision);
        if (error != null) return UnprocessableEntity(error);
        contract.Status = ContractStatus.PendingReview;
        contract.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(Success(new { status = "PendingReview" }));
    }

    [HttpPost("{id:guid}/return")]
    public async Task<IActionResult> Return(Guid id, ReviewDecisionRequest request, CancellationToken ct)
    {
        if (!IsAdmin) return Forbid();
        if (string.IsNullOrWhiteSpace(request.Reason))
            return BadRequest(Failure("REASON_REQUIRED", "Bắt buộc nhập lý do trả hồ sơ."));
        var contract = await _db.FilmContractEntity.FindAsync([id], ct);
        if (contract == null) return NotFound();
        if (contract.Status is not (ContractStatus.PendingReview or ContractStatus.ReadyToSign))
            return Conflict(Failure("CONTRACT_STATE_CONFLICT", "Hồ sơ không thể trả lại ở trạng thái hiện tại."));
        contract.Status = ContractStatus.Draft;
        contract.UpdatedAt = DateTime.UtcNow;
        var revision = await _db.ContractRevisionEntity.SingleAsync(x => x.ContractId == id && x.IsCurrent, ct);
        revision.ReviewedDataJson = JsonSerializer.Serialize(new
        {
            previousData = revision.ReviewedDataJson, returnedReason = request.Reason,
            returnedAt = DateTime.UtcNow
        }, JsonOptions);
        await _db.SaveChangesAsync(ct);
        return Ok(Success(new { status = "Draft" }));
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
    {
        if (!IsAdmin) return Forbid();
        var contract = await _db.FilmContractEntity.FindAsync([id], ct);
        if (contract == null) return NotFound();
        if (contract.Status != ContractStatus.PendingReview)
            return Conflict(Failure("CONTRACT_STATE_CONFLICT", "Chỉ hồ sơ PENDING_REVIEW mới được duyệt."));
        var revision = await CurrentRevision(id, ct);
        var error = ValidateRevision(revision);
        if (error != null) return UnprocessableEntity(error);
        contract.Status = ContractStatus.ReadyToSign;
        contract.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(Success(new { status = "ReadyToSign", revision = revision.RevisionNumber }));
    }

    [HttpPost("{id:guid}/sign")]
    public async Task<IActionResult> Sign(Guid id, SignContractRequest request, CancellationToken ct)
    {
        if (!IsAdmin) return Forbid();
        var userId = _user.GetUserId();
        var signer = await _db.UserInfoEntity.AsNoTracking().SingleAsync(x => x.UserId == userId, ct);
        if (string.IsNullOrWhiteSpace(request.Password) ||
            !_passwordHasher.Validate(signer.Password, request.Password))
            return Unauthorized(Failure("SIGN_PASSWORD_INVALID", "Mật khẩu xác nhận không đúng."));

        var contract = await _db.FilmContractEntity.FindAsync([id], ct);
        if (contract == null) return NotFound();
        if (contract.Status != ContractStatus.ReadyToSign)
            return Conflict(Failure("CONTRACT_STATE_CONFLICT", "Hợp đồng chưa sẵn sàng ký."));
        var revision = await CurrentRevision(id, ct);
        revision.ContentHash = HashRevision(revision);
        if (await _db.ContractSignOffEntity.AnyAsync(x =>
            x.ContractId == id && x.ContractRevisionId == revision.ContractRevisionId, ct))
            return Conflict(Failure("CONTRACT_ALREADY_SIGNED", "Revision này đã được ký."));
        _db.ContractSignOffEntity.Add(new ContractSignOffEntity
        {
            ContractSignOffId = Guid.NewGuid(), ContractId = id,
            ContractRevisionId = revision.ContractRevisionId, SignedByUserId = userId,
            SignedAt = DateTime.UtcNow, SignedContentHash = revision.ContentHash,
            IsInternalApproval = true
        });
        contract.Status = ContractStatus.Signed;
        contract.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(Success(new { status = "Signed", revision = revision.RevisionNumber, contentHash = revision.ContentHash }));
    }

    [HttpPost("{id:guid}/activate")]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
    {
        if (!IsAdmin) return Forbid();
        await using var transaction = await _db.Database.BeginTransactionAsync(ct);
        var contract = await _db.FilmContractEntity
            .Include(x => x.Revisions.Where(r => r.IsCurrent)).ThenInclude(r => r.Documents)
            .Include(x => x.Revisions.Where(r => r.IsCurrent)).ThenInclude(r => r.MovieLines)
            .SingleOrDefaultAsync(x => x.ContractId == id, ct);
        if (contract == null) return NotFound();
        if (contract.Status == ContractStatus.Activated)
            return Ok(Success(new { status = "Activated", alreadyApplied = true }));
        if (contract.Status != ContractStatus.Signed)
            return Conflict(Failure("CONTRACT_STATE_CONFLICT", "Chỉ hợp đồng SIGNED mới được kích hoạt."));

        var revision = contract.Revisions.Single();
        var signOff = await _db.ContractSignOffEntity.AsNoTracking().SingleOrDefaultAsync(x =>
            x.ContractId == id && x.ContractRevisionId == revision.ContractRevisionId, ct);
        if (signOff == null || signOff.SignedContentHash != HashRevision(revision))
            return Conflict(Failure("SIGNED_REVISION_CHANGED", "Dữ liệu đã thay đổi sau khi ký; cần ký revision mới."));
        var error = ValidateRevision(revision);
        if (error != null) return UnprocessableEntity(error);

        foreach (var line in revision.MovieLines)
        {
            var movie = line.MovieId.HasValue
                ? await _db.MovieInfoEntity.FindAsync([line.MovieId.Value], ct) : null;
            if (line.MovieId.HasValue && movie == null)
                return UnprocessableEntity(Failure("MOVIE_LINK_INVALID", "Phim liên kết không tồn tại."));
            if (movie == null)
            {
                movie = new MovieInfoEntity
                {
                    MovieId = Guid.NewGuid(), MovieRequiredAgeId = line.MovieRequiredAgeId,
                    MovieName = line.VietnameseTitle, MovieDescription = line.Description,
                    MovieImageUrl = line.PosterUrl ?? "", MovieBannerUrl = line.PosterUrl ?? "",
                    TrailerUrl = line.TrailerUrl ?? "", Director = line.Director ?? "",
                    Actors = line.Actors ?? "", MovieDuration = line.DurationMinutes,
                    ActiveAt = line.LicenseStartAt, EndedDate = line.LicenseEndAt,
                    IsCommingSoon = line.LicenseStartAt > DateTime.UtcNow,
                    IsActive = line.LicenseStartAt <= DateTime.UtcNow && line.LicenseEndAt >= DateTime.UtcNow,
                    MovieManagerId = contract.AssignedMovieManagerId,
                    CreatedByUserId = _user.GetUserId()
                };
                _db.MovieInfoEntity.Add(movie);
                line.MovieId = movie.MovieId;
            }

            if (!await _db.ExhibitionRightEntity.AnyAsync(x =>
                x.ContractId == id && x.ContractMovieLineId == line.ContractMovieLineId, ct))
            {
                var cinemaIds = line.CinemaScopeState == ContractScopeState.Specified
                    ? ParseIds(line.CinemaIdsJson).Cast<Guid?>().ToList() : [null];
                var formatIds = line.FormatScopeState == ContractScopeState.Specified
                    ? ParseIds(line.FormatIdsJson).Cast<Guid?>().ToList() : [null];
                foreach (var cinemaId in cinemaIds)
                foreach (var formatId in formatIds)
                    _db.ExhibitionRightEntity.Add(new ExhibitionRightEntity
                    {
                        ExhibitionRightId = Guid.NewGuid(), ContractId = id,
                        ContractRevisionId = revision.ContractRevisionId,
                        ContractMovieLineId = line.ContractMovieLineId, MovieId = movie.MovieId,
                        CinemaId = cinemaId, FormatId = formatId, StartsAt = line.LicenseStartAt,
                        EndsAt = line.LicenseEndAt, CinemaSharePercent = line.CinemaSharePercent,
                        DistributorSharePercent = line.DistributorSharePercent, IsActive = true
                    });
            }
            await EnsureCatalogRelations(movie.MovieId, line, ct);
        }

        contract.Status = ContractStatus.Activated;
        contract.ProcessingStatus = ContractProcessingStatus.Applied;
        contract.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return Ok(Success(new
        {
            status = "Activated",
            appliedMovies = revision.MovieLines.Select(x => x.MovieId)
        }));
    }

    [HttpPost("{id:guid}/suspend")]
    public Task<IActionResult> Suspend(Guid id, ReviewDecisionRequest request, CancellationToken ct) =>
        SetOperationalState(id, request.Reason, ContractStatus.Activated, ContractStatus.Suspended, false, ct);

    [HttpPost("{id:guid}/resume")]
    public Task<IActionResult> Resume(Guid id, ReviewDecisionRequest request, CancellationToken ct) =>
        SetOperationalState(id, request.Reason, ContractStatus.Suspended, ContractStatus.Activated, true, ct);

    [HttpPost("{id:guid}/terminate")]
    public async Task<IActionResult> Terminate(Guid id, ReviewDecisionRequest request, CancellationToken ct)
    {
        if (!IsAdmin) return Forbid();
        if (string.IsNullOrWhiteSpace(request.Reason)) return BadRequest(Failure("REASON_REQUIRED", "Bắt buộc nhập lý do chấm dứt."));
        var contract = await _db.FilmContractEntity.FindAsync([id], ct);
        if (contract == null) return NotFound();
        if (contract.Status is not (ContractStatus.Activated or ContractStatus.Suspended)) return Conflict();
        contract.Status = ContractStatus.Terminated; contract.UpdatedAt = DateTime.UtcNow;
        var rights = await _db.ExhibitionRightEntity.Where(x => x.ContractId == id).ToListAsync(ct);
        rights.ForEach(x => x.IsActive = false);
        await _db.SaveChangesAsync(ct);
        return Ok(Success(new { status = "Terminated" }));
    }

    [HttpGet("revenue/movies")]
    public async Task<IActionResult> MovieRevenue([FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
    {
        if (!IsAdmin) return Forbid();
        var start = from.HasValue ? Utc(from.Value) : DateTime.UtcNow.AddDays(-30);
        var end = to.HasValue ? Utc(to.Value) : DateTime.UtcNow;
        var query = from snapshot in _db.TicketRevenueSnapshotEntity.AsNoTracking()
                    join movie in _db.MovieInfoEntity.AsNoTracking() on snapshot.MovieId equals movie.MovieId
                    join contract in _db.FilmContractEntity.AsNoTracking() on snapshot.ContractId equals contract.ContractId
                    join distributor in _db.DistributorEntity.AsNoTracking() on contract.DistributorId equals distributor.DistributorId into distributors
                    from distributor in distributors.DefaultIfEmpty()
                    where snapshot.ShowtimeAt >= start && snapshot.ShowtimeAt <= end
                    group snapshot by new { snapshot.MovieId, movie.MovieName, snapshot.ContractId, contract.InternalCode, DistributorName = distributor == null ? null : distributor.LegalName } into grouped
                    select new
                    {
                        grouped.Key.MovieId, grouped.Key.MovieName, grouped.Key.ContractId, grouped.Key.InternalCode, grouped.Key.DistributorName,
                        tickets = grouped.Count(), ticketRevenue = grouped.Sum(x => x.TicketNetAmount - x.RefundedAmount),
                        revenueBasis = grouped.Sum(x => x.RevenueBasisAmount), cinemaShare = grouped.Sum(x => x.CinemaShareAmount),
                        distributorShare = grouped.Sum(x => x.DistributorShareAmount)
                    };
        var rows = await query.OrderByDescending(x => x.cinemaShare).ThenByDescending(x => x.ticketRevenue).ToListAsync(ct);
        var totalRevenue = rows.Sum(x => x.ticketRevenue);
        var totalCinemaShare = rows.Sum(x => x.cinemaShare);
        var data = rows.Select(x => new
        {
            x.MovieId, x.MovieName, x.ContractId, x.InternalCode, x.DistributorName, x.tickets,
            x.ticketRevenue, x.revenueBasis, x.cinemaShare, x.distributorShare,
            revenueWeightPercent = totalRevenue == 0 ? 0 : decimal.Round(x.ticketRevenue * 100 / totalRevenue, 2),
            cinemaShareWeightPercent = totalCinemaShare == 0 ? 0 : decimal.Round(x.cinemaShare * 100 / totalCinemaShare, 2),
            effectiveCinemaRate = x.revenueBasis == 0 ? 0 : decimal.Round(x.cinemaShare * 100 / x.revenueBasis, 2)
        });
        return Ok(Success(new { from = start, to = end, totalRevenue, totalCinemaShare, movies = data }));
    }

    private async Task<IActionResult> SetOperationalState(Guid id, string reason, ContractStatus expected,
        ContractStatus next, bool enableRights, CancellationToken ct)
    {
        if (!IsAdmin) return Forbid();
        if (string.IsNullOrWhiteSpace(reason)) return BadRequest(Failure("REASON_REQUIRED", "Bắt buộc nhập lý do."));
        var contract = await _db.FilmContractEntity.FindAsync([id], ct);
        if (contract == null) return NotFound();
        if (contract.Status != expected) return Conflict(Failure("CONTRACT_STATE_CONFLICT", "Trạng thái hợp đồng không phù hợp."));
        contract.Status = next; contract.UpdatedAt = DateTime.UtcNow;
        var rights = await _db.ExhibitionRightEntity.Where(x => x.ContractId == id).ToListAsync(ct);
        var now = DateTime.UtcNow;
        rights.ForEach(x => x.IsActive = enableRights && x.EndsAt >= now);
        await _db.SaveChangesAsync(ct);
        return Ok(Success(new { status = next.ToString() }));
    }

    private IQueryable<FilmContractEntity> Scope()
    {
        var query = _db.FilmContractEntity.AsQueryable();
        return IsAdmin ? query : query.Where(x => x.AssignedMovieManagerId == _user.GetUserId());
    }

    private Task<FilmContractEntity?> Editable(Guid id, CancellationToken ct) =>
        Scope().SingleOrDefaultAsync(x => x.ContractId == id, ct);

    private Task<ContractRevisionEntity> CurrentRevision(Guid id, CancellationToken ct) =>
        _db.ContractRevisionEntity.Include(x => x.Documents).Include(x => x.MovieLines)
            .SingleAsync(x => x.ContractId == id && x.IsCurrent, ct);

    private bool IsAdmin => _user.IsInRole("Admin");

    private async Task<string> NextCode(CancellationToken ct)
    {
        var year = DateTime.UtcNow.Year;
        var number = await _db.FilmContractEntity.CountAsync(x => x.CreatedAt.Year == year, ct) + 1;
        var code = $"HD-{year}-{number:0000}";
        while (await _db.FilmContractEntity.AnyAsync(x => x.InternalCode == code, ct))
            code = $"HD-{year}-{++number:0000}";
        return code;
    }

    private object? ValidateRevision(ContractRevisionEntity revision)
    {
        if (revision.Documents.Count == 0)
            return Failure("CONTRACT_DOCUMENT_REQUIRED", "Hợp đồng chưa có tài liệu nguồn.");
        if (!revision.DataReviewed || !revision.FinancialPolicyReviewed)
            return Failure("CONTRACT_REVIEW_INCOMPLETE", "Dữ liệu và tài chính phải được đối chiếu.");
        if (revision.MovieLines.Count == 0)
            return Failure("CONTRACT_MOVIE_REQUIRED", "Hợp đồng phải có ít nhất một phim.");
        foreach (var line in revision.MovieLines)
        {
            if (!line.Reviewed || string.IsNullOrWhiteSpace(line.VietnameseTitle) ||
                line.DurationMinutes <= 0 || line.MovieRequiredAgeId == Guid.Empty)
                return Failure("CONTRACT_MOVIE_INVALID", $"Thông tin phim '{line.VietnameseTitle}' chưa đầy đủ.");
            if (line.LicenseEndAt <= line.LicenseStartAt)
                return Failure("CONTRACT_LICENSE_PERIOD_INVALID", $"Thời hạn của '{line.VietnameseTitle}' không hợp lệ.");
            if (line.CinemaScopeState == ContractScopeState.Unresolved ||
                line.FormatScopeState == ContractScopeState.Unresolved)
                return Failure("CONTRACT_SCOPE_UNRESOLVED", $"Phạm vi của '{line.VietnameseTitle}' chưa rõ.");
            if (line.CinemaScopeState == ContractScopeState.Specified && ParseIds(line.CinemaIdsJson).Count == 0)
                return Failure("CONTRACT_CINEMA_SCOPE_EMPTY", "Đã giới hạn rạp nhưng chưa chọn rạp.");
            if (line.FormatScopeState == ContractScopeState.Specified && ParseIds(line.FormatIdsJson).Count == 0)
                return Failure("CONTRACT_FORMAT_SCOPE_EMPTY", "Đã giới hạn định dạng nhưng chưa chọn định dạng.");
            if (line.CinemaSharePercent < 0 || line.DistributorSharePercent < 0 ||
                line.CinemaSharePercent + line.DistributorSharePercent != 100)
                return Failure("CONTRACT_REVENUE_SHARE_INVALID", $"Tỷ lệ chia của '{line.VietnameseTitle}' phải bằng 100%.");
        }
        return null;
    }

    private async Task EnsureCatalogRelations(Guid movieId, ContractMovieLineEntity line, CancellationToken ct)
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
    }

    private static string HashRevision(ContractRevisionEntity revision)
    {
        var canonical = JsonSerializer.Serialize(new
        {
            revision.RevisionNumber, revision.ReviewedDataJson,
            documents = revision.Documents.Select(x => x.Sha256).OrderBy(x => x),
            lines = revision.MovieLines.OrderBy(x => x.ContractMovieLineId).Select(x => new
            {
                x.MovieId, x.VietnameseTitle, x.DurationMinutes, x.MovieRequiredAgeId,
                x.LicenseStartAt, x.LicenseEndAt, x.CinemaScopeState, x.FormatScopeState,
                x.CinemaIdsJson, x.FormatIdsJson, x.CinemaSharePercent,
                x.DistributorSharePercent, x.RevenueBasis
            })
        }, JsonOptions);
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical))).ToLowerInvariant();
    }

    private string[] AllowedActions(FilmContractEntity contract)
    {
        if (IsAdmin) return contract.Status switch
        {
            ContractStatus.Draft => ["upload", "extract", "review", "submit"],
            ContractStatus.PendingReview => ["approve", "return"],
            ContractStatus.ReadyToSign => ["sign", "return"],
            ContractStatus.Signed => ["activate"],
            ContractStatus.Activated => ["suspend", "terminate"],
            ContractStatus.Suspended => ["resume", "terminate"],
            _ => []
        };
        return contract.Status == ContractStatus.Draft ? ["upload", "extract", "review", "submit"] : [];
    }

    private static List<Guid> ParseIds(string json)
    {
        try { return JsonSerializer.Deserialize<List<Guid>>(json, JsonOptions) ?? []; }
        catch { return []; }
    }

    private static DateTime Utc(DateTime value) =>
        value.Kind == DateTimeKind.Utc ? value : value.ToUniversalTime();
    private static string? Trim(string? value, int max) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim()[..Math.Min(value.Trim().Length, max)];
    private static object Success(object data) => new { isSuccess = true, data };
    private static object Failure(string code, string message) =>
        new { isSuccess = false, errorCode = code, message };
    private static bool MatchesSignature(string extension, byte[] h) => extension switch
    {
        ".pdf" => h.Length >= 4 && h[0] == 0x25 && h[1] == 0x50 && h[2] == 0x44 && h[3] == 0x46,
        ".png" => h.Length >= 4 && h[0] == 0x89 && h[1] == 0x50 && h[2] == 0x4E && h[3] == 0x47,
        _ => h.Length >= 3 && h[0] == 0xFF && h[1] == 0xD8 && h[2] == 0xFF
    };
    private static string ContentTypeFor(string extension) => extension switch
    {
        ".pdf" => "application/pdf", ".png" => "image/png", _ => "image/jpeg"
    };
}

public sealed record CreateContractRequest(Guid? DistributorId, string? DistributorName,
    string? CounterpartyContractNumber, Guid? AssignedMovieManagerId, Guid? TemplateId, bool IsDemo = false);
public sealed record ReviewDecisionRequest(string Reason);
public sealed record SignContractRequest(string Password);
public sealed record ReviewExtractionRequest(List<ContractMovieLineRequest> MovieLines,
    bool FinancialPolicyReviewed);
public sealed record ContractMovieLineRequest(Guid? MovieId, string VietnameseTitle,
    string? EnglishTitle, string? Description, string? PosterUrl, string? TrailerUrl,
    string? Director, string? Actors, int DurationMinutes, Guid MovieRequiredAgeId,
    DateTime LicenseStartAt, DateTime LicenseEndAt, ContractScopeState CinemaScopeState,
    ContractScopeState FormatScopeState, List<Guid> CinemaIds, List<Guid> FormatIds,
    decimal CinemaSharePercent, decimal DistributorSharePercent, string? RevenueBasis,
    RevenueSettlementCycle SettlementCycle, bool Reviewed);
