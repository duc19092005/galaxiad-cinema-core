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

public class CreateMovieUseCase
{
    private readonly IUserContextService _userContextService;
    private readonly ILogger<CreateMovieUseCase> _logger;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAdminMovieManagementRepository _adminRepository;
    private readonly IImageStorageService _imageStorageService;
    private readonly IAuditLogService _auditLogService;
    private readonly IBackgroundJobScheduler _jobScheduler;
    private readonly IAiMovieEmbeddingSyncService _aiMovieEmbeddingSyncService;
    private readonly IMovieCacheService _cacheService;

    public CreateMovieUseCase(
        IUserContextService userContextService, 
        ILogger<CreateMovieUseCase> logger, 
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

    public async Task<BaseResponse<string>> ExecuteAsync(ReqAddMovieManagerMovieDto request)
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
                    throw new AppException(Messages.Movie.BannerUploadError, 400, "E01");
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
            
            await _unitOfWork.SaveChangesAsync();
            await transactions.CommitAsync();

            try
            {
                await _cacheService.ClearMovieCatalogCacheAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to clear movie catalog cache on Redis");
            }

            // Enqueue job registration to background AFTER transaction is committed
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
}
