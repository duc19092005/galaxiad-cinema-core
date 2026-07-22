using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.MovieManager.Requests;
using Cinema.Application.Interfaces;
using Cinema.Domain.Entities.MovieInfos;
using Microsoft.Extensions.Logging;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.Interfaces.Admin;
using Cinema.Application.Validators;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Utils;

namespace Cinema.Application.UseCases.MovieManager.MovieInfos;

public class UpdateMovieUseCase
{
    private readonly IUserContextService _userContextService;
    private readonly ILogger<UpdateMovieUseCase> _logger;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAdminMovieManagementRepository _adminRepository;
    private readonly IImageStorageService _imageStorageService;
    private readonly IAuditLogService _auditLogService;
    private readonly IBackgroundJobScheduler _jobScheduler;
    private readonly IAiMovieEmbeddingSyncService _aiMovieEmbeddingSyncService;
    private readonly IMovieCacheService _cacheService;

    public UpdateMovieUseCase(
        IUserContextService userContextService, 
        ILogger<UpdateMovieUseCase> logger, 
        IUnitOfWork unitOfWork,
        IAdminMovieManagementRepository adminRepository,
        IImageStorageService imageStorageService, 
        IAuditLogService auditLogService,
        IBackgroundJobScheduler jobScheduler,
        IAiMovieEmbeddingSyncService aiMovieEmbeddingSyncService,
        IMovieCacheService cacheService)
    {
        _userContextService = userContextService;
        _logger = logger;
        _unitOfWork = unitOfWork;
        _adminRepository = adminRepository;
        _imageStorageService = imageStorageService;
        _auditLogService = auditLogService;
        _jobScheduler = jobScheduler;
        _aiMovieEmbeddingSyncService = aiMovieEmbeddingSyncService;
        _cacheService = cacheService;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(Guid itemId, ReqEditMovieManagerMovieDto request)
    {
        await using var transactions = await _unitOfWork.BeginTransactionAsync();
        (bool Success, string Result) fileUploadStatus = (false, "upload false");
        (bool Success, string Result) bannerUploadStatus = (false, string.Empty);
        string oldImageUrl = null!;
        string oldBannerUrl = null!;
        try
        {
            request.StartedDate = DateTimeHelper.NormalizeIncoming(request.StartedDate);
            request.EndedDate = DateTimeHelper.NormalizeIncoming(request.EndedDate);

            var findTheMovie = await _adminRepository.GetMovieInfoEntityAsync(itemId);
            if (findTheMovie == null)
            {
                throw new NotFoundException(Messages.Movie.NotFoundById(itemId));
            }
            else
            {
                var getUserId = _userContextService.GetUserId();
                var validationsErrors = new List<string>();

                var hasSuccessfulBooking = await _adminRepository.HasSuccessfulBookingAsync(itemId);

                if (hasSuccessfulBooking)
                {
                    throw new BadRequestException(Messages.Movie.CannotEditActiveShowtimes, "E03");
                }

                if (!string.IsNullOrEmpty(request.MovieName))
                {
                    if (await _adminRepository.IsMovieNameExistsAsync(request.MovieName, itemId))
                    {
                        validationsErrors.Add(Messages.Movie.NameAlreadyExists);
                    }
                }

                if (request.Duration != null)
                {
                    if (request.Duration < 0 || request.Duration >= 500)
                    {
                        validationsErrors.Add(Messages.Movie.InvalidDuration);
                    }
                }
                
                if (!string.IsNullOrEmpty(request.MovieDescription))
                {
                    if (await _adminRepository.IsMovieDescriptionExistsAsync(request.MovieDescription, itemId))
                    {
                        validationsErrors.Add(Messages.Movie.DescriptionAlreadyExists);
                    }
                }
                var (isValid, message) = GeneralValidation.ValidateDates(
                    request.StartedDate,
                    request.EndedDate,
                    findTheMovie.ActiveAt,
                    findTheMovie.EndedDate
                );
                if (!isValid)
                {
                    validationsErrors.Add(message);
                }

                if (validationsErrors.Count > 0)
                {
                    throw new BadRequestException(validationsErrors, "S01");
                }

                findTheMovie.MovieRequiredAgeId = request.MovieRequiredAgeId ?? findTheMovie.MovieRequiredAgeId;
                findTheMovie.MovieDescription = request.MovieDescription ?? findTheMovie.MovieDescription;
                findTheMovie.MovieName = request.MovieName ?? findTheMovie.MovieName;
                findTheMovie.ActiveAt = request.StartedDate ?? findTheMovie.ActiveAt;
                findTheMovie.EndedDate = request.EndedDate ?? findTheMovie.EndedDate;
                findTheMovie.UpdatedAt = DateTime.UtcNow;
                findTheMovie.UpdatedByUserId = getUserId;
                findTheMovie.IsActive =
                    (request.EndedDate ?? findTheMovie.EndedDate) > DateTime.UtcNow && (request.StartedDate ?? findTheMovie.ActiveAt) <= DateTime.UtcNow;
                findTheMovie.IsCommingSoon = (request.StartedDate ?? findTheMovie.ActiveAt) > DateTime.UtcNow;
                findTheMovie.MovieDuration = request.Duration ?? findTheMovie.MovieDuration;
                findTheMovie.TrailerUrl = request.TrailerUrl ?? findTheMovie.TrailerUrl;
                findTheMovie.Director = request.Director ?? findTheMovie.Director;
                findTheMovie.Actors = request.Actors ?? findTheMovie.Actors;
                
                if (request.MovieImage != null)
                {
                    fileUploadStatus = await _imageStorageService.PostImageAsync(request.MovieImage);
                    if (fileUploadStatus.Success)
                    {
                        oldImageUrl = findTheMovie.MovieImageUrl;
                        findTheMovie.MovieImageUrl = fileUploadStatus.Result;
                    }
                    else
                    {
                        _logger.LogError(fileUploadStatus.Result);
                        throw CustomSystemException.SystemExceptionCaller();
                    }
                }

                if (request.MovieBanner != null)
                {
                    bannerUploadStatus = await _imageStorageService.PostImageAsync(request.MovieBanner);
                    if (bannerUploadStatus.Success)
                    {
                        oldBannerUrl = findTheMovie.MovieBannerUrl;
                        findTheMovie.MovieBannerUrl = bannerUploadStatus.Result;

                        // Keep cover table in sync: set primary cover to this banner
                        var existingCovers = await _adminRepository.GetMovieCoverImagesByMovieIdAsync(itemId);
                        var primary = existingCovers.FirstOrDefault(c => c.IsPrimary) ?? existingCovers.OrderBy(c => c.SortOrder).FirstOrDefault();
                        if (primary != null)
                        {
                            primary.ImageUrl = bannerUploadStatus.Result;
                            primary.IsPrimary = true;
                        }
                        else
                        {
                            await _adminRepository.AddMovieCoverImagesAsync(new[]
                            {
                                new MovieCoverImageEntity
                                {
                                    MovieCoverImageId = Guid.NewGuid(),
                                    MovieId = itemId,
                                    ImageUrl = bannerUploadStatus.Result,
                                    SortOrder = 0,
                                    IsPrimary = true,
                                    IsActive = true,
                                    CreatedAt = DateTime.UtcNow
                                }
                            });
                        }
                    }
                    else
                    {
                        _logger.LogError(bannerUploadStatus.Result);
                        throw CustomSystemException.SystemExceptionCaller();
                    }
                }

                // Remove selected cover images
                if (request.RemoveCoverImageIds != null && request.RemoveCoverImageIds.Count > 0)
                {
                    var existingCovers = await _adminRepository.GetMovieCoverImagesByMovieIdAsync(itemId);
                    var toRemove = existingCovers
                        .Where(c => request.RemoveCoverImageIds.Contains(c.MovieCoverImageId))
                        .ToList();
                    if (toRemove.Count > 0)
                    {
                        _adminRepository.RemoveMovieCoverImages(toRemove);
                        foreach (var cover in toRemove)
                        {
                            try { await _imageStorageService.DeleteImageAsync(cover.ImageUrl); } catch (Exception exDel)
                            {
                                _logger.LogWarning(exDel, "Could not delete cover image: {Url}", cover.ImageUrl);
                            }
                        }

                        // Refresh primary banner url if needed
                        var remaining = existingCovers.Except(toRemove).OrderBy(c => c.SortOrder).ToList();
                        if (remaining.Count > 0)
                        {
                            var newPrimary = remaining.FirstOrDefault(c => c.IsPrimary) ?? remaining.First();
                            foreach (var c in remaining) c.IsPrimary = c.MovieCoverImageId == newPrimary.MovieCoverImageId;
                            findTheMovie.MovieBannerUrl = newPrimary.ImageUrl;
                        }
                        else if (string.IsNullOrEmpty(findTheMovie.MovieBannerUrl) || toRemove.Any(c => c.ImageUrl == findTheMovie.MovieBannerUrl))
                        {
                            findTheMovie.MovieBannerUrl = string.Empty;
                        }
                    }
                }

                // Append multi banners
                if (request.MovieBanners != null && request.MovieBanners.Count > 0)
                {
                    var existingCovers = await _adminRepository.GetMovieCoverImagesByMovieIdAsync(itemId);
                    var nextOrder = existingCovers.Count == 0 ? 0 : existingCovers.Max(c => c.SortOrder) + 1;
                    var newCovers = new List<MovieCoverImageEntity>();
                    var appendedUrls = new List<string>();

                    foreach (var file in request.MovieBanners.Where(f => f != null && f.Length > 0))
                    {
                        var upload = await _imageStorageService.PostImageAsync(file);
                        if (!upload.Success)
                        {
                            foreach (var url in appendedUrls)
                            {
                                try { await _imageStorageService.DeleteImageAsync(url); } catch { /* ignore */ }
                            }
                            throw new AppException(Messages.Movie.BannerUploadError, 400, "E01");
                        }
                        appendedUrls.Add(upload.Result);
                        newCovers.Add(new MovieCoverImageEntity
                        {
                            MovieCoverImageId = Guid.NewGuid(),
                            MovieId = itemId,
                            ImageUrl = upload.Result,
                            SortOrder = nextOrder++,
                            IsPrimary = existingCovers.Count == 0 && newCovers.Count == 0,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        });
                    }

                    if (newCovers.Count > 0)
                    {
                        // First appended becomes primary if none exist
                        if (existingCovers.Count == 0)
                        {
                            newCovers[0].IsPrimary = true;
                            findTheMovie.MovieBannerUrl = newCovers[0].ImageUrl;
                        }
                        await _adminRepository.AddMovieCoverImagesAsync(newCovers);
                    }
                }

                if (request.MovieFormatIds != null && request.MovieFormatIds.Any())
                {
                    var findTheFormats = await _adminRepository.GetMovieFormatsByMovieIdAsync(itemId);
                    _adminRepository.RemoveMovieFormats(findTheFormats);

                    await _adminRepository.AddMovieFormatsAsync(request.MovieFormatIds.Distinct().Select(id => new movieFormatMovieInfoEntity()
                    {
                        MovieId = itemId,
                        FormatId = id
                    }));
                }
                if (request.MovieGenreIds != null && request.MovieGenreIds.Any())
                {
                    var findTheGenres = await _adminRepository.GetMovieGenresByMovieIdAsync(itemId);
                    _adminRepository.RemoveMovieGenres(findTheGenres);

                    await _adminRepository.AddMovieGenresAsync(request.MovieGenreIds.Distinct().Select(id => new MovieGenreMovieInfoEntity()
                    {
                        MovieId = itemId,
                        MovieGenreId = id
                    }));
                }

                if (request.CinemaIds != null && request.CinemaIds.Any())
                {
                    var existingCinemas = await _adminRepository.GetMovieCinemasByMovieIdAsync(itemId);
                    _adminRepository.RemoveMovieCinemas(existingCinemas);

                    await _adminRepository.AddMovieCinemasAsync(request.CinemaIds.Distinct().Select(id => new MovieCinemaEntity()
                    {
                        MovieId = itemId,
                        CinemaId = id
                    }));
                }

                await _auditLogService.WriteAsync(
                    "Update",
                    "Movie",
                    itemId,
                    findTheMovie.MovieName,
                    $"Updated movie {findTheMovie.MovieName}.",
                    request.CinemaIds?.FirstOrDefault() ?? (await _adminRepository.GetMovieCinemasByMovieIdAsync(itemId))
                        .Select(x => (Guid?)x.CinemaId)
                        .FirstOrDefault());

                await _unitOfWork.SaveChangesAsync();
                await transactions.CommitAsync();

                try
                {
                    await _cacheService.ClearMovieCatalogCacheAsync();
                    await _cacheService.ClearMovieDetailCacheAsync(itemId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to clear movie cache on Redis");
                }

                // Enqueue job update to background AFTER transaction is committed
                _jobScheduler.Enqueue<IScheduleJobsService>(s => s.UpdatedJobIntoBackground(SchedulesJobCategoryEnums.Movies, itemId, request.StartedDate, request.EndedDate));
                await _aiMovieEmbeddingSyncService.SyncMovieAsync(itemId);

                if (fileUploadStatus.Success && !string.IsNullOrEmpty(oldImageUrl))
                {
                    try
                    {
                        await _imageStorageService.DeleteImageAsync(oldImageUrl);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Could not delete old image: {Url}", oldImageUrl);
                    }
                }
                if (bannerUploadStatus.Success && !string.IsNullOrEmpty(oldBannerUrl))
                {
                    try
                    {
                        await _imageStorageService.DeleteImageAsync(oldBannerUrl);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Could not delete old banner: {Url}", oldBannerUrl);
                    }
                }

                return new BaseResponse<string>()
                {
                    IsSuccess = true,
                    Message = Messages.Movie.EditCompleted
                };
            }
        }
        catch (Exception ex)
        {
            await transactions.RollbackAsync();
            if (fileUploadStatus.Success)
            {
                var deleteImageFromCloudinary = await _imageStorageService.DeleteImageAsync(fileUploadStatus.Result);
                if (!deleteImageFromCloudinary)
                {
                    _logger.LogError(ex, "Error while delete image from Cloudinary");
                }
            }
            if (bannerUploadStatus.Success)
            {
                var deleteBannerFromCloudinary = await _imageStorageService.DeleteImageAsync(bannerUploadStatus.Result);
                if (!deleteBannerFromCloudinary)
                {
                    _logger.LogError(ex, "Error while delete banner from Cloudinary");
                }
            }
            if (ex is AppException)
            {
                throw;
            }
            _logger.LogError(ex, "There's a error while edit movie");
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
}
