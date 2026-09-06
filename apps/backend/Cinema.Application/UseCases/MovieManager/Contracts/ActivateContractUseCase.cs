using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Domain.Entities.Contracts;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.Contracts;

public class ActivateContractUseCase
{
    private readonly IContractRepository _repository;
    private readonly IUserContextService _userContext;

    public ActivateContractUseCase(IContractRepository repository, IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<(bool AlreadyApplied, IEnumerable<Guid?> AppliedMovies)> ExecuteAsync(Guid contractId, CancellationToken ct)
    {
        if (!_userContext.IsInRole("Admin"))
            throw new AppException("Chỉ Admin mới có quyền kích hoạt hợp đồng.", 403, "FORBIDDEN");

        var userId = _userContext.GetUserId();
        await using var tx = await _repository.BeginTransactionAsync(ct);

        var contract = await _repository.GetContractByIdAsync(contractId, ct);
        if (contract == null)
            throw new AppException("Không tìm thấy hợp đồng.", 404, "CONTRACT_NOT_FOUND");

        var revision = await _repository.GetCurrentRevisionAsync(contractId, ct);
        if (revision == null)
            throw new AppException("Không tìm thấy revision hợp đồng.", 404, "REVISION_NOT_FOUND");

        if (contract.Status == ContractStatus.Activated)
            return (true, revision.MovieLines.Select(x => x.MovieId));

        if (contract.Status != ContractStatus.Signed)
            throw new AppException("Chỉ hợp đồng SIGNED mới được kích hoạt.", 409, "CONTRACT_STATE_CONFLICT");

        var signOff = await _repository.GetSignOffAsync(contractId, revision.ContractRevisionId, ct);
        if (signOff == null || signOff.SignedContentHash != ContractRevisionValidator.Hash(revision))
            throw new AppException("Dữ liệu đã thay đổi sau khi ký; cần ký revision mới.", 409, "SIGNED_REVISION_CHANGED");

        ContractRevisionValidator.Validate(revision);

        foreach (var line in revision.MovieLines)
        {
            MovieInfoEntity? movie = null;
            if (line.MovieId.HasValue)
            {
                movie = await _repository.GetMovieByIdAsync(line.MovieId.Value, ct);
                if (movie == null)
                    throw new AppException("Phim liên kết không tồn tại.", 422, "MOVIE_LINK_INVALID");
            }

            if (movie == null)
            {
                movie = new MovieInfoEntity
                {
                    MovieId = Guid.NewGuid(),
                    MovieRequiredAgeId = line.MovieRequiredAgeId,
                    MovieName = line.VietnameseTitle,
                    MovieDescription = line.Description,
                    MovieImageUrl = line.PosterUrl ?? "",
                    MovieBannerUrl = line.PosterUrl ?? "",
                    TrailerUrl = line.TrailerUrl ?? "",
                    Director = line.Director ?? "",
                    Actors = line.Actors ?? "",
                    MovieDuration = line.DurationMinutes,
                    ActiveAt = line.LicenseStartAt,
                    EndedDate = line.LicenseEndAt,
                    IsCommingSoon = line.LicenseStartAt > DateTime.UtcNow,
                    IsActive = line.LicenseStartAt <= DateTime.UtcNow && line.LicenseEndAt >= DateTime.UtcNow,
                    MovieManagerId = contract.AssignedMovieManagerId,
                    CreatedByUserId = userId
                };
                await _repository.AddMovieAsync(movie, ct);
                line.MovieId = movie.MovieId;
            }

            var rightExists = await _repository.ExhibitionRightExistsAsync(contractId, line.ContractMovieLineId, ct);
            if (!rightExists)
            {
                var cinemaIds = line.CinemaScopeState == ContractScopeState.Specified
                    ? ContractRevisionValidator.ParseIds(line.CinemaIdsJson).Cast<Guid?>().ToList()
                    : [null];
                var formatIds = line.FormatScopeState == ContractScopeState.Specified
                    ? ContractRevisionValidator.ParseIds(line.FormatIdsJson).Cast<Guid?>().ToList()
                    : [null];

                var newRights = new List<ExhibitionRightEntity>();
                foreach (var cinemaId in cinemaIds)
                {
                    foreach (var formatId in formatIds)
                    {
                        newRights.Add(new ExhibitionRightEntity
                        {
                            ExhibitionRightId = Guid.NewGuid(),
                            ContractId = contractId,
                            ContractRevisionId = revision.ContractRevisionId,
                            ContractMovieLineId = line.ContractMovieLineId,
                            MovieId = movie.MovieId,
                            CinemaId = cinemaId,
                            FormatId = formatId,
                            StartsAt = line.LicenseStartAt,
                            EndsAt = line.LicenseEndAt,
                            CinemaSharePercent = line.CinemaSharePercent,
                            DistributorSharePercent = line.DistributorSharePercent,
                            IsActive = true
                        });
                    }
                }
                await _repository.AddExhibitionRightsAsync(newRights, ct);
            }

            await _repository.EnsureCatalogRelationsAsync(movie.MovieId, line, ct);
        }

        contract.Status = ContractStatus.Activated;
        contract.ProcessingStatus = ContractProcessingStatus.Applied;
        contract.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync(ct);
        return (false, revision.MovieLines.Select(x => x.MovieId));
    }
}
