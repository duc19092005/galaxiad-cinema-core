using System.Security.Claims;
using Shared.Exceptions;
using BusinessLayer.Interfaces.IBehaviors;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.MovieManager;
using BusinessLayer.Interfaces.IBehaviors;
using BusinessLayer.Validators;
using BusinessLayer.Validators.MovieManager;
using DataAccess;
using DataAccess.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Shared.Exceptions;
using Shared.Utils;

namespace BusinessLayer.UseCases.MovieManager.MovieInfos;

public class WriteMovieInfosUseCase : IWriteBehavior<ReqAddMovieManagerMovieDto, ReqEditMovieManagerMovieDto, string>
{
    private readonly IUserContextService _userContextService;
    private readonly ILogger<WriteMovieInfosUseCase> _logger;
    private readonly CinemaDbContext _dbContext;
    private readonly cloudinaryHelper _cloudinaryHelper;

    public WriteMovieInfosUseCase(IUserContextService userContextService, ILogger<WriteMovieInfosUseCase> logger, CinemaDbContext dbContext,
        cloudinaryHelper cloudinaryHelper)
    {
        _userContextService = userContextService;
        _logger = logger;
        _dbContext = dbContext;
        _cloudinaryHelper = cloudinaryHelper;
    }
    
    public async Task<BaseResponse<string>> AddItem(ReqAddMovieManagerMovieDto request)
    {
        using var transactions = await _dbContext.Database.BeginTransactionAsync();
        (bool success, string result) cloudinaryStatus = (false, string.Empty);        
        try
        {
            var getUserId = _userContextService.GetUserId();
            
            // Assuming movieInfoValidate is static or needs refactoring. Leaving as is if static, but fixing namespace if needed.
            var isExitsMovieName =
                await MovieInfoValidate.IsExistMovieName(_dbContext, request.MovieName, null);
            
            var isExitsMovieDescription =
                await MovieInfoValidate.IsExistMovieDescription(_dbContext, request.MovieDescription, null);
            
            if (isExitsMovieName)
            {
                throw new AppException("Movie Name is already in use" , 400 , "E01");
            }else if(isExitsMovieDescription)
            {
                throw new AppException("Movie Descriptions is already in use" , 400 , "E01");
            }
            
            // Add Into Databases
            var newMovieId = Guid.NewGuid();

            cloudinaryStatus = await _cloudinaryHelper.PostImageIntoCloudinary(request.MovieImage);
            if (!cloudinaryStatus.success)
            {
                throw new AppException("Error uploading image to Cloudinary", 400 , "E01");
            }

            var newMovieEntity = new MovieInfoEntity()
            {
                MovieId = newMovieId,
                MovieDescription = request.MovieDescription,
                MovieName = request.MovieName,
                MovieImageUrl = cloudinaryStatus.result,
                MovieRequiredAgeId = request.MovieRequiredAgeId,
                EndedDate = request.EndedDate,
                ActiveAt = request.StartedDate,
                IsActive = DateTime.Now > request.StartedDate,
                CreatedByUserId = getUserId
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

            return new BaseResponse<string>()
            {
                Data = null,
                IsSuccess = true,
                Message = "Add Movie Completed"
            };
        }catch (Exception ex)
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
        (bool success, string result) fileUploadStatus = (false , "upload false");
        string oldImageURL = null!;
        try
        {
            var findTheMovie = await _dbContext.MovieInfoEntity.FirstOrDefaultAsync(x => x.MovieId == itemId);
            if (findTheMovie == null)
            {
                throw new NotFoundException($"Movie with Id : {itemId} does not exist");
            }
            else
            {
                var getUserId = _userContextService.GetUserId();
                var validationsError = new List<string>();
                
                if (!string.IsNullOrEmpty(request.MovieName))
                {
                    if (await MovieInfoValidate.IsExistMovieName(_dbContext, request.MovieName, itemId))
                    {
                        validationsError.Add("Movie Name already exists");
                    }
                } 
                if (!string.IsNullOrEmpty(request.MovieDescription))
                {
                    if (await MovieInfoValidate.IsExistMovieDescription(_dbContext, request.MovieDescription, itemId))
                    {
                        validationsError.Add("Movie Description already exists");
                    }
                }
                if (request.StartedDate != null && request.StartedDate < DateTime.Now)
                {
                    validationsError.Add("Started Date is invalid , started date must be higher than the current date");
                } 
                if (request.EndedDate != null && request.EndedDate < DateTime.Now)
                {
                    validationsError.Add("Ended Date is invalid ,ended date must be higher than the current date");
                } 
                if (request.StartedDate != null && request.EndedDate != null
                                                      && request.StartedDate > request.EndedDate)
                {
                    validationsError.Add("Started Date is invalid , Started Date must be lower than the ended date");
                }

                if (validationsError.Count > 0)
                {
                    throw new AppException(String.Join(" " , validationsError), 400, "S01");
                }
                
                 
                findTheMovie.MovieRequiredAgeId = request.MovieRequiredAgeId ?? findTheMovie.MovieRequiredAgeId;
                findTheMovie.MovieDescription = request.MovieDescription ?? findTheMovie.MovieDescription;
                findTheMovie.MovieName = request.MovieName ?? findTheMovie.MovieName;
                findTheMovie.ActiveAt = request.StartedDate ?? findTheMovie.ActiveAt;
                findTheMovie.EndedDate = request.EndedDate ?? findTheMovie.EndedDate;
                findTheMovie.UpdatedAt = DateTime.Now;
                findTheMovie.UpdatedByUserId = getUserId;
                findTheMovie.IsActive = (request.EndedDate ?? findTheMovie.EndedDate) > DateTime.Now;
                
                if (request.MovieImage != null)
                {
                    fileUploadStatus = await _cloudinaryHelper.PostImageIntoCloudinary(request.MovieImage);
                    if (fileUploadStatus.success)
                    {
                        oldImageURL = findTheMovie.MovieImageUrl;
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

                if (fileUploadStatus.success && !string.IsNullOrEmpty(oldImageURL))
                {
                    try 
                    {
                        await _cloudinaryHelper.DeleteImageFromCloudinary(oldImageURL);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Could not delete old image: {Url}", oldImageURL);
                    }
                }
                
                return new BaseResponse<string>()
                {
                    IsSuccess = true,
                    Message = "Edit Movie Completed"
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
                    _logger.LogError(ex , "Error while delete image from Cloudinary");
                }
            }
            if (ex is AppException)
            {
                throw;
            }
            _logger.LogError(ex , "There's a error while edit movie");
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    public async Task<BaseResponse<string>> DeleteItem(Guid itemId)
    {
        return null!;
    }
}
