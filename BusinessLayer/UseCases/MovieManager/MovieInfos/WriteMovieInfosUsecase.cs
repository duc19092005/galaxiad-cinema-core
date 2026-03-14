using Shared.Exceptions;
using Shared.Localization;
using BusinessLayer.Interfaces.IBehaviors;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.MovieManager.Requests;
using BusinessLayer.Services.ApplicationServices;
using BusinessLayer.Services.IdentityAccess;
using BusinessLayer.Validators.MovieManager;
using DataAccess;
using DataAccess.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using BusinessLayer.Services.ThirdPersonServices;
using BusinessLayer.Validators;
using Shared.Enums;
using Hangfire;

namespace BusinessLayer.UseCases.MovieManager.MovieInfos;

public class WriteMovieInfosUseCase : IWriteBehavior<ReqAddMovieManagerMovieDto, ReqEditMovieManagerMovieDto, string>
{
    private readonly IUserContextService _userContextService;
    private readonly ILogger<WriteMovieInfosUseCase> _logger;
    private readonly CinemaDbContext _dbContext;
    private readonly cloudinaryHelper _cloudinaryHelper;
    private readonly IScheduleJobsService _scheduleJobsService;


    public WriteMovieInfosUseCase(IUserContextService userContextService, ILogger<WriteMovieInfosUseCase> logger, CinemaDbContext dbContext,
        cloudinaryHelper cloudinaryHelper , IScheduleJobsService scheduleJobService)
    {
        _userContextService = userContextService;
        _logger = logger;
        _dbContext = dbContext;
        _cloudinaryHelper = cloudinaryHelper;
        _scheduleJobsService = scheduleJobService;
    }

    public async Task<BaseResponse<string>> AddItem(ReqAddMovieManagerMovieDto request)
    {
        using var transactions = await _dbContext.Database.BeginTransactionAsync();
        (bool success, string result) cloudinaryStatus = (false, string.Empty);
        try
        {
            var getUserId = _userContextService.GetUserId();

            var isExitsMovieName =
                await MovieInfoValidate.IsExistMovieName(_dbContext, request.MovieName, null);

            var isExitsMovieDescription =
                await MovieInfoValidate.IsExistMovieDescription(_dbContext, request.MovieDescription, null);

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

            cloudinaryStatus = await _cloudinaryHelper.PostImageIntoCloudinary(request.MovieImage);
            if (!cloudinaryStatus.success)
            {
                throw new AppException(Messages.Movie.ImageUploadError, 400, "E01");
            }

            var newMovieEntity = new MovieInfoEntity()
            {
                MovieId = newMovieId,
                MovieDescription = request.MovieDescription,
                MovieName = request.MovieName,
                MovieImageUrl = cloudinaryStatus.result,
                MovieRequiredAgeId = request.MovieRequiredAgeId,
                ActiveAt = request.StartedDate,
                EndedDate = request.EndedDate,
                IsActive = DateTime.Now >= request.StartedDate && request.EndedDate > DateTime.Now,
                CreatedByUserId = getUserId,
                ManagerId = getUserId,
                MovieDuration = request.Duration,
                TrailerUrl = request.TrailerUrl ?? string.Empty,
                Director = request.Director ?? string.Empty,
                Actors = request.Actors ?? string.Empty,
                IsCommingSoon = DateTime.Now < request.StartedDate,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
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

            await _dbContext.MovieInfoEntity.AddAsync(newMovieEntity);
            await _dbContext.MovieFormatMovieInfoEntity.AddRangeAsync(newMovieFormatMovieInfos);
            await _dbContext.MovieGenreMovieInfoEntity.AddRangeAsync(newMovieGenreMovieInfos);
            
            await _dbContext.SaveChangesAsync();
            await transactions.CommitAsync();

            // Enqueue job registration to background AFTER transaction is committed
            // This prevents race conditions where the job runs before the DB has the record.
            BackgroundJob.Enqueue<IScheduleJobsService>(s => s.AddJobIntoBackground(SchedulesJobCategoryEnums.Movies, newMovieId, request.StartedDate, request.EndedDate));

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

            if (cloudinaryStatus.success)
            {
                await _cloudinaryHelper.DeleteImageFromCloudinary(cloudinaryStatus.result);
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
        using var transactions = await _dbContext.Database.BeginTransactionAsync();
        (bool success, string result) fileUploadStatus = (false, "upload false");
        string oldImageUrl = null!;
        try
        {
            var findTheMovie = await _dbContext.MovieInfoEntity.FirstOrDefaultAsync(x => x.MovieId == itemId);
            if (findTheMovie == null)
            {
                throw new NotFoundException(Messages.Movie.NotFoundById(itemId));
            }
            else
            {
                var getUserId = _userContextService.GetUserId();
                var validationsErrors = new List<string>();

                if (!string.IsNullOrEmpty(request.MovieName))
                {
                    if (await MovieInfoValidate.IsExistMovieName(_dbContext, request.MovieName, itemId))
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
                    if (await MovieInfoValidate.IsExistMovieDescription(_dbContext, request.MovieDescription, itemId))
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

                // (Remove original position)
                // BackgroundJob.Enqueue updated to move after commit

                findTheMovie.MovieRequiredAgeId = request.MovieRequiredAgeId ?? findTheMovie.MovieRequiredAgeId;
                findTheMovie.MovieDescription = request.MovieDescription ?? findTheMovie.MovieDescription;
                findTheMovie.MovieName = request.MovieName ?? findTheMovie.MovieName;
                findTheMovie.ActiveAt = request.StartedDate ?? findTheMovie.ActiveAt;
                findTheMovie.EndedDate = request.EndedDate ?? findTheMovie.EndedDate;
                findTheMovie.UpdatedAt = DateTime.Now;
                findTheMovie.UpdatedByUserId = getUserId;
                findTheMovie.IsActive =
                    (request.EndedDate ?? findTheMovie.EndedDate) > DateTime.Now && (request.StartedDate ?? findTheMovie.ActiveAt) <= DateTime.Now;
                findTheMovie.IsCommingSoon = (request.StartedDate ?? findTheMovie.ActiveAt) > DateTime.Now;
                findTheMovie.MovieDuration = request.Duration ?? findTheMovie.MovieDuration;
                findTheMovie.TrailerUrl = request.TrailerUrl ?? findTheMovie.TrailerUrl;
                findTheMovie.Director = request.Director ?? findTheMovie.Director;
                findTheMovie.Actors = request.Actors ?? findTheMovie.Actors;
                
                if (request.MovieImage != null)
                {
                    fileUploadStatus = await _cloudinaryHelper.PostImageIntoCloudinary(request.MovieImage);
                    if (fileUploadStatus.success)
                    {
                        oldImageUrl = findTheMovie.MovieImageUrl;
                        findTheMovie.MovieImageUrl = fileUploadStatus.result;
                    }
                    else
                    {
                        _logger.LogError(fileUploadStatus.result);
                        throw CustomSystemException.SystemExceptionCaller();
                    }
                }

                if (request.MovieFormatIds != null && request.MovieFormatIds.Any())
                {
                    // Truy Van trong dbo
                    var findTheFormats = _dbContext.MovieFormatMovieInfoEntity.Where(x => x.MovieId.Equals(itemId));
                    _dbContext.MovieFormatMovieInfoEntity.RemoveRange(findTheFormats);

                    // Add Again in databases

                    _dbContext.MovieFormatMovieInfoEntity.AddRange(request.MovieFormatIds.Distinct().Select(id => new movieFormatMovieInfoEntity()
                    {
                        MovieId = itemId,
                        FormatId = id
                    }));
                }

                if (request.MovieGenreIds != null && request.MovieGenreIds.Any())
                {
                    // Truy Van trong dbo
                    var findTheGenres = _dbContext.MovieGenreMovieInfoEntity.Where(x => x.MovieId.Equals(itemId));
                    _dbContext.MovieGenreMovieInfoEntity.RemoveRange(findTheGenres);

                    // Add Again in databases

                    _dbContext.MovieGenreMovieInfoEntity.AddRange(request.MovieGenreIds.Distinct().Select(id => new MovieGenreMovieInfoEntity()
                    {
                        MovieId = itemId,
                        MovieGenreId = id
                    }));
                }

                await _dbContext.SaveChangesAsync();
                await transactions.CommitAsync();

                // Enqueue job update to background AFTER transaction is committed
                BackgroundJob.Enqueue<IScheduleJobsService>(s => s.UpdatedJobIntoBackground(SchedulesJobCategoryEnums.Movies, itemId, request.StartedDate, request.EndedDate));

                if (fileUploadStatus.success && !string.IsNullOrEmpty(oldImageUrl))
                {
                    try
                    {
                        await _cloudinaryHelper.DeleteImageFromCloudinary(oldImageUrl);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Could not delete old image: {Url}", oldImageUrl);
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
            if (fileUploadStatus.success)
            {
                var deleteImageFromCloudinary = await _cloudinaryHelper.DeleteImageFromCloudinary(fileUploadStatus.result);
                if (!deleteImageFromCloudinary)
                {
                    _logger.LogError(ex, "Error while delete image from Cloudinary");
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
        var movie = await _dbContext.MovieInfoEntity
            .FirstOrDefaultAsync(x => x.MovieId == itemId);
            
        if (movie == null)
        {
            throw new NotFoundException(Messages.Movie.NotFoundById(itemId));
        }

        if (movie.IsDeleted)
        {
            throw new BadRequestException("Phim này đã bị xóa.", "D01");
        }

        var hasSuccessfulBooking = await _dbContext.Set<DataAccess.Entities.UserInfos.OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleInfoEntity.MovieId == itemId &&
                            (od.OrderInfoEntity.OrderStatus == Shared.Enums.OrderStatusEnum.Booked));

        if (hasSuccessfulBooking)
        {
            movie.IsDeleted = true;
            movie.DeletedByUserId = getCurrentUserId;
            movie.DeletedAt = DateTime.Now;
            _dbContext.MovieInfoEntity.Update(movie);
        }
        else
        {
            var hasAnyBooking = await _dbContext.Set<DataAccess.Entities.UserInfos.OrderDetailsInfo>()
                .AnyAsync(od => od.MovieScheduleInfoEntity.MovieId == itemId);

            if (hasAnyBooking)
            {
                // Soft delete to avoid foreign key conflict with failed/canceled orders
                movie.IsDeleted = true;
                movie.DeletedByUserId = getCurrentUserId;
                movie.DeletedAt = DateTime.Now;
                _dbContext.MovieInfoEntity.Update(movie);
            }
            else
            {
                // Hard delete
                var schedules = await _dbContext.MovieScheduleInfoEntity.Where(x => x.MovieId == itemId).ToListAsync();
                _dbContext.MovieScheduleInfoEntity.RemoveRange(schedules);

                var movieFormats = await _dbContext.MovieFormatMovieInfoEntity.Where(x => x.MovieId == itemId).ToListAsync();
                _dbContext.MovieFormatMovieInfoEntity.RemoveRange(movieFormats);

                var movieGenres = await _dbContext.MovieGenreMovieInfoEntity.Where(x => x.MovieId == itemId).ToListAsync();
                _dbContext.MovieGenreMovieInfoEntity.RemoveRange(movieGenres);

                _dbContext.MovieInfoEntity.Remove(movie);
            }
        }
        
        await _dbContext.SaveChangesAsync();

        return new BaseResponse<string>()
        {
            Message = "Xóa phim thành công",
            Data = null,
            IsSuccess = true
        };
    }

    public async Task UpdatedComingMovieStatusJobs(Guid movieId)
    {
        var findMovie = await _dbContext.MovieInfoEntity.FindAsync(movieId);
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
                _dbContext.MovieInfoEntity.Update(findMovie);
                await _dbContext.SaveChangesAsync();
            }
            catch(Exception e)
            {
                _logger.LogError(e, $"Error while update movie status id : {movieId}");
            }
        }
    }
    
    public async Task UpdatedOverDueStatus(Guid movieId)
    {
        var findMovie = await _dbContext.MovieInfoEntity.FindAsync(movieId);
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
                _dbContext.MovieInfoEntity.Update(findMovie);
                await _dbContext.SaveChangesAsync();
            }
            catch(Exception e)
            {
                _logger.LogError(e, $"Error while update movie status id : {movieId}");
            }
        }
    }
}
