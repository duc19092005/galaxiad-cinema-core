using Cinema.Domain.Exceptions;
using Cinema.Domain.Localization;
using Cinema.Application.Interfaces.IBehaviors;
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

public class WriteMovieInfosUseCase : IWriteBehavior<ReqAddMovieManagerMovieDto, ReqEditMovieManagerMovieDto, string>
{
    private readonly IUserContextService _userContextService;
    private readonly ILogger<WriteMovieInfosUseCase> _logger;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAdminRepository _adminRepository;
    private readonly IImageStorageService _imageStorageService;
    private readonly IScheduleJobsService _scheduleJobsService;
    private readonly IAuditLogService _auditLogService;
    private readonly IBackgroundJobScheduler _jobScheduler;
    private readonly IAiMovieEmbeddingSyncService _aiMovieEmbeddingSyncService;


    public WriteMovieInfosUseCase(IUserContextService userContextService, ILogger<WriteMovieInfosUseCase> logger, IUnitOfWork unitOfWork,
        IAdminRepository adminRepository,
        IImageStorageService imageStorageService, IScheduleJobsService scheduleJobService, IAuditLogService auditLogService,
        IBackgroundJobScheduler jobScheduler,
        IAiMovieEmbeddingSyncService aiMovieEmbeddingSyncService)
    {
        _userContextService = userContextService;
        _logger = logger;
        _unitOfWork = unitOfWork;
        _adminRepository = adminRepository;
        _imageStorageService = imageStorageService;
        _scheduleJobsService = scheduleJobService;
        _auditLogService = auditLogService;
        _jobScheduler = jobScheduler;
        _aiMovieEmbeddingSyncService = aiMovieEmbeddingSyncService;
    }

    public async Task<BaseResponse<string>> AddItem(ReqAddMovieManagerMovieDto request)
    {
        await using var transactions = await _unitOfWork.BeginTransactionAsync();
        (bool Success, string Result) cloudinaryStatus = (false, string.Empty);
        (bool Success, string Result) bannerUploadStatus = (false, string.Empty);
        try
        {
            request.StartedDate = DateTimeHelper.NormalizeIncoming(request.StartedDate);
            request.EndedDate = DateTimeHelper.NormalizeIncoming(request.EndedDate);
            var getUserId = _userContextService.GetUserId();

            var isExitsMovieName =
                await _adminRepository.IsMovieNameExistsAsync(request.MovieName, null);

            var isExitsMovieDescription =
                await _adminRepository.IsMovieDescriptionExistsAsync(request.MovieDescription, null);

            var validationErrors = new List<string>();

            if (isExitsMovieName)
            {
                validationErrors.Add(Messages.Movie.NameAlreadyInUse);
            }

            if (request.Duration < 0 || request.Duration >= 500)
            {
                validationErrors.Add(Messages.Movie.InvalidDuration);
            }

            if (isExitsMovieDescription)
            {
                validationErrors.Add(Messages.Movie.DescriptionAlreadyInUse);
            }
            var checkingDates = GeneralValidation.ValidateDates(request.StartedDate, request.EndedDate);
            if (!checkingDates.IsValid)
            {
                validationErrors.Add(checkingDates.Message);
            }

            if (validationErrors.Any())
            {
                throw new BadRequestException(validationErrors, "E01");
            }

            // Add Into Databases
            var newMovieId = Guid.NewGuid();

            cloudinaryStatus = await _imageStorageService.PostImageAsync(request.MovieImage);
            if (!cloudinaryStatus.Success)
            {
                throw new AppException(Messages.Movie.ImageUploadError, 400, "E01");
            }

            // Upload banner if provided
            if (request.MovieBanner != null)
            {
                bannerUploadStatus = await _imageStorageService.PostImageAsync(request.MovieBanner);
                if (!bannerUploadStatus.Success)
                {
                    throw new AppException("Failed to upload banner image", 400, "E01");
                }
            }

            var newMovieEntity = new MovieInfoEntity()
            {
                MovieId = newMovieId,
                MovieDescription = request.MovieDescription,
                MovieName = request.MovieName,
                MovieImageUrl = cloudinaryStatus.Result,
                MovieBannerUrl = bannerUploadStatus.Result,
                MovieRequiredAgeId = request.MovieRequiredAgeId,
                ActiveAt = request.StartedDate,
                EndedDate = request.EndedDate,
                IsActive = DateTime.UtcNow >= request.StartedDate && request.EndedDate > DateTime.UtcNow,
                CreatedByUserId = getUserId,
                MovieManagerId = getUserId,
                MovieDuration = request.Duration,
                TrailerUrl = request.TrailerUrl ?? string.Empty,
                Director = request.Director ?? string.Empty,
                Actors = request.Actors ?? string.Empty,
                IsCommingSoon = DateTime.UtcNow < request.StartedDate,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var newMovieGenreMovieInfos = request.MovieGenreIds.Select(id => new MovieGenreMovieInfoEntity()
            {
                MovieId = newMovieId,
                MovieGenreId = id
            });

            var newMovieFormatMovieInfos = request.MovieFormatIds.Select(id => new movieFormatMovieInfoEntity()
            {
                MovieId = newMovieId,
                FormatId = id
            });

            var newMovieCinemaInfos = request.CinemaIds.Select(id => new MovieCinemaEntity()
            {
                MovieId = newMovieId,
                CinemaId = id
            });

            await _adminRepository.AddMovieAsync(newMovieEntity);
            await _adminRepository.AddMovieFormatsAsync(newMovieFormatMovieInfos);
            await _adminRepository.AddMovieGenresAsync(newMovieGenreMovieInfos);
            await _adminRepository.AddMovieCinemasAsync(newMovieCinemaInfos);
            
            await _auditLogService.WriteAsync(
                "Create",
                "Movie",
                newMovieId,
                request.MovieName,
                $"Created movie {request.MovieName}.",
                request.CinemaIds.FirstOrDefault());
            
            await _adminRepository.SaveChangesAsync();
            await transactions.CommitAsync();

            // Enqueue job registration to background AFTER transaction is committed
            // This prevents race conditions where the job runs before the DB has the record.
            _jobScheduler.Enqueue<IScheduleJobsService>(s => s.AddJobIntoBackground(SchedulesJobCategoryEnums.Movies, newMovieId, request.StartedDate, request.EndedDate));
            await _aiMovieEmbeddingSyncService.SyncMovieAsync(newMovieId);

            return new BaseResponse<string>()
            {
                Data = null,
                IsSuccess = true,
                Message = Messages.Movie.AddCompleted
            };
        }
        catch (Exception ex)
        {
            await transactions.RollbackAsync();

            if (cloudinaryStatus.Success)
            {
                await _imageStorageService.DeleteImageAsync(cloudinaryStatus.Result);
            }
            if (bannerUploadStatus.Success)
            {
                await _imageStorageService.DeleteImageAsync(bannerUploadStatus.Result);
            }

            if (ex is AppException)
            {
                throw;
            }

            _logger.LogError(ex, "Error creating movie");

            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    public async Task<BaseResponse<string>> UpdateItem(Guid itemId, ReqEditMovieManagerMovieDto request)
    {
        // Update the Movie
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
                    throw new BadRequestException("Không thể sửa phim khi đã có khách hàng đặt vé thành công.", "E03");
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
                    }
                    else
                    {
                        _logger.LogError(bannerUploadStatus.Result);
                        throw CustomSystemException.SystemExceptionCaller();
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

                await _adminRepository.SaveChangesAsync();
                await transactions.CommitAsync();

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
            // Roll Back
            await transactions.RollbackAsync();
            // Deleted new image if upload completed
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

    public async Task<BaseResponse<string>> DeleteItem(Guid itemId)
    {
        var getCurrentUserId = _userContextService.GetUserId();

        var movie = await _adminRepository.GetMovieInfoEntityAsync(itemId);
            
        if (movie == null)
        {
            throw new NotFoundException(Messages.Movie.NotFoundById(itemId));
        }

        if (movie.IsDeleted)
        {
            throw new BadRequestException("Phim này đã bị xóa.", "D01");
        }

        var hasSuccessfulBooking = await _adminRepository.HasSuccessfulBookingAsync(itemId);

        if (hasSuccessfulBooking)
        {
            movie.IsDeleted = true;
            movie.DeletedByUserId = getCurrentUserId;
            movie.DeletedAt = DateTime.UtcNow;
            _adminRepository.UpdateMovie(movie);
        }
        else
        {
            var hasAnyBooking = await _adminRepository.HasAnyBookingAsync(itemId);

            if (hasAnyBooking)
            {
                // Soft delete to avoid foreign key conflict with failed/canceled orders
                movie.IsDeleted = true;
                movie.DeletedByUserId = getCurrentUserId;
                movie.DeletedAt = DateTime.UtcNow;
                _adminRepository.UpdateMovie(movie);
            }
            else
            {
                // Hard delete
                await _adminRepository.HardDeleteMovieAsync(itemId);
            }
        }
        
        await _auditLogService.WriteAsync(
            "Delete",
            "Movie",
            movie.MovieId,
            movie.MovieName,
            $"Deleted movie {movie.MovieName}.",
            (await _adminRepository.GetMovieCinemasByMovieIdAsync(itemId))
                .Select(x => (Guid?)x.CinemaId)
                .FirstOrDefault());

        await _adminRepository.SaveChangesAsync();
        await _aiMovieEmbeddingSyncService.DeleteMovieAsync(itemId);

        return new BaseResponse<string>()
        {
            Message = "Xóa phim thành công",
            Data = null,
            IsSuccess = true
        };
    }

    public async Task UpdatedComingMovieStatusJobs(Guid movieId)
    {
        var findMovie = await _adminRepository.GetMovieInfoEntityAsync(movieId);
        if (findMovie == null)
        {
            // Log the error
            _logger.LogError("Can't find movie with id: {movieId} to run Jobs", movieId);
        }
        else
        {
            try
            {
                findMovie.IsCommingSoon = false;
                findMovie.IsActive = true;
                _adminRepository.UpdateMovie(findMovie);
                await _adminRepository.SaveChangesAsync();
                await _aiMovieEmbeddingSyncService.SyncMovieAsync(movieId);
            }
            catch(Exception e)
            {
                _logger.LogError(e, $"Error while update movie status id : {movieId}");
            }
        }
    }
    
    public async Task UpdatedOverDueStatus(Guid movieId)
    {
        var findMovie = await _adminRepository.GetMovieInfoEntityAsync(movieId);
        if (findMovie == null)
        {
            // Log the error
            _logger.LogError("Can't find movie with id: {movieId} to run Jobs", movieId);
        }
        else
        {
            try
            {
                findMovie.IsCommingSoon = false;
                findMovie.IsActive = false;
                _adminRepository.UpdateMovie(findMovie);
                await _adminRepository.SaveChangesAsync();
                await _aiMovieEmbeddingSyncService.DeleteMovieAsync(movieId);
            }
            catch(Exception e)
            {
                _logger.LogError(e, $"Error while update movie status id : {movieId}");
            }
        }
    }
}
