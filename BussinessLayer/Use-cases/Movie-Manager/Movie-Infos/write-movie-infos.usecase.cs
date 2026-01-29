using System.Security.Claims;
using Backend.Shard.Exceptions;
using BussinessLayer.Dtos;
using BussinessLayer.Dtos.Movie_Manager;
using BussinessLayer.Interfaces.i_Behaviors;
using BussinessLayer.Validates.Movie_Manager;
using DataAccess;
using DataAccess.Entities.Movie_infos;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query.Internal;
using Microsoft.Extensions.Logging;
using Shared.Ultis;

namespace BussinessLayer.Use_cases.Movie_Manager.Movie_Infos;

public class movieManagerWriteMovieInfosUseCase : IWriteBehavior<reqAddMovieManagerMovieDto , reqEditMovieManagerMovieDto , string>
{
    private readonly  IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<movieManagerWriteMovieInfosUseCase> _logger;
    private readonly cinemaDbContext _dbContext;
    private readonly cloudinaryHelper _cloudinaryHelper;

    public movieManagerWriteMovieInfosUseCase(IHttpContextAccessor httpContextAccessor, ILogger<movieManagerWriteMovieInfosUseCase> logger, cinemaDbContext dbContext ,
        cloudinaryHelper cloudinaryHelper)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
        _dbContext = dbContext;
        _cloudinaryHelper = cloudinaryHelper;
    }
    
    public async Task<baseResponse<string>> AddItem(reqAddMovieManagerMovieDto request)
    {
        var transactions = await _dbContext.Database.BeginTransactionAsync();
        (bool success, string result) cloudinaryStatus = (false, string.Empty);        
        try
        {
            var getUserId = Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(
                ClaimTypes.Sid)?.Value);
            
            var isExitsMovieName =
                await movieInfoValidate.IsExistMovieName(_dbContext, request.MovieName, null);
            
            var isExitsMovieDescription =
                await movieInfoValidate.IsExistMovieDescription(_dbContext, request.MovieDescription, null);
            
            if (isExitsMovieName)
            {
                throw new appException("Movie Name is already in use" , 400 , "E01");
            }else if(isExitsMovieDescription)
            {
                throw new appException("Movie Descriptions is already in use" , 400 , "E01");
            }
            
            // Add Into Databases
            var newMovieId = Guid.NewGuid();

            cloudinaryStatus = await _cloudinaryHelper.PostImageIntoCloudinary(request.MovieImage);
            if (!cloudinaryStatus.Item1)
            {
                throw new appException("Error uploading image to Cloudinary", 400 , "E01");
            }

            var newMovieEntity = new movieInfoEntity()
            {
                movieId = newMovieId,
                movieDescription = request.MovieDescription,
                movieName = request.MovieName,
                movieImageUrl = cloudinaryStatus.Item2,
                movieRequiredAgeId = request.MovieRequiredAgeId,
                endedDate = request.EndedDate,
                ActiveAt = request.StartedDate,
                isActive = DateTime.Now > request.StartedDate,
                createdByUserId = getUserId
            };

            var newMovieGenreMovieInfos = request.MovieGenreIds.Select(id => new movieGenreMovieInfoEntity()
            {
                movieId = newMovieId,
                movieGenreId = id
            });

            var newMovieFormatMovieInfos = request.MovieFormatIds.Select(id => new movieFormatMovieInfoEntity()
            {
                MovieId = newMovieId,
                FormatId = id
            });
            
            await _dbContext.movieInfoEntity.AddAsync(newMovieEntity);
            await _dbContext.movieFormatMovieInfoEntity.AddRangeAsync(newMovieFormatMovieInfos);
            await _dbContext.movieGenreMovieInfoEntity.AddRangeAsync(newMovieGenreMovieInfos);
            
            await _dbContext.SaveChangesAsync();
            await transactions.CommitAsync();

            return new baseResponse<string>()
            {
                data = null,
                isSuccess = true,
                message = "Add Movie Completed"
            };
        }catch (Exception ex)
        {
            await transactions.RollbackAsync();

            if (cloudinaryStatus.success)
            {
                await _cloudinaryHelper.DeleteImageFromCloudinary(cloudinaryStatus.result);
            }

            if (ex is appException) 
            {
                throw; 
            }

            _logger.LogError(ex, "Lỗi tạo phim");
            
            throw systemException.SystemExceptionCaller();
        }
    }

    public async Task<baseResponse<string>> UpdateItem(Guid itemId, reqEditMovieManagerMovieDto request)
    {
        // Update the Movie
        var transactions = await _dbContext.Database.BeginTransactionAsync();
        (bool , string) fileUploadStatus = (false , "upload false");
        string oldImageURL = null!;
        try
        {
            var findTheMovie = await _dbContext.movieInfoEntity.FirstOrDefaultAsync(x => x.movieId == itemId);
            if (findTheMovie == null)
            {
                throw new notFoundException($"Movie with Id : {itemId} does not exist");
            }
            else
            {
                var getUserId = Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(
                    ClaimTypes.Sid)?.Value);
                var validationsError = new List<string>();
                
                if (!string.IsNullOrEmpty(request.MovieName))
                {
                    if (await movieInfoValidate.IsExistMovieName(_dbContext, request.MovieName, itemId))
                    {
                        validationsError.Add("Movie Name already exists");
                    }
                        
                } 
                if (!string.IsNullOrEmpty(request.MovieDescription))
                {
                    if (await movieInfoValidate.IsExistMovieDescription(_dbContext, request.MovieDescription, itemId))
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
                    throw new appException(String.Join(" " , validationsError), 400, "S01");
                }
                
                 
                findTheMovie.movieRequiredAgeId = request.MovieRequiredAgeId ?? findTheMovie.movieRequiredAgeId;
                findTheMovie.movieDescription = request.MovieDescription ?? findTheMovie.movieDescription;
                findTheMovie.movieName = request.MovieName ?? findTheMovie.movieName;
                findTheMovie.ActiveAt = request.StartedDate ?? findTheMovie.ActiveAt;
                findTheMovie.endedDate = request.EndedDate ?? findTheMovie.endedDate;
                findTheMovie.updatedAt = DateTime.Now;
                findTheMovie.updatedByUserId = getUserId;
                findTheMovie.isActive = (request.EndedDate ?? findTheMovie.endedDate) > DateTime.Now;
                
                if (request.MovieImage != null)
                {
                    fileUploadStatus = await _cloudinaryHelper.PostImageIntoCloudinary(request.MovieImage);
                    if (fileUploadStatus.Item1)
                    {
                        oldImageURL = findTheMovie.movieImageUrl;
                        findTheMovie.movieImageUrl = fileUploadStatus.Item2;
                    }
                    else
                    {
                        _logger.LogError(fileUploadStatus.Item2);
                        throw systemException.SystemExceptionCaller();
                    }
                }

                if (request.MovieFormatIds != null && request.MovieFormatIds.Any())
                {
                    // Truy Van trong dbo
                    var findTheFormats = _dbContext.movieFormatMovieInfoEntity.Where(x => x.MovieId.Equals(itemId));
                    _dbContext.movieFormatMovieInfoEntity.RemoveRange(findTheFormats);
                    
                    // Add Again in databases

                    _dbContext.movieFormatMovieInfoEntity.AddRange(request.MovieFormatIds.Distinct().Select(id => new movieFormatMovieInfoEntity()
                    {
                        MovieId = itemId,
                        FormatId = id
                    }));
                }

                if (request.MovieGenreIds != null && request.MovieGenreIds.Any())
                {
                    // Truy Van trong dbo
                    var findTheGenres = _dbContext.movieGenreMovieInfoEntity.Where(x => x.movieId.Equals(itemId));
                    _dbContext.movieGenreMovieInfoEntity.RemoveRange(findTheGenres);
                    
                    // Add Again in databases

                    _dbContext.movieGenreMovieInfoEntity.AddRange(request.MovieGenreIds.Distinct().Select(id => new movieGenreMovieInfoEntity()
                    {
                        movieId = itemId,
                        movieGenreId = id
                    }));
                }
                
                await _dbContext.SaveChangesAsync();
                await transactions.CommitAsync();

                if (fileUploadStatus.Item1 && !string.IsNullOrEmpty(oldImageURL))
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
                
                return new baseResponse<string>()
                {
                    isSuccess = true,
                    message = "Edit Movie Completed"
                };
            }
        }
        catch (Exception ex)
        {
            // Roll Back
            await transactions.RollbackAsync();
            // Deleted new image if upload completed
            if (fileUploadStatus.Item1)
            {
                var deleteImageFromCloudinary = await _cloudinaryHelper.DeleteImageFromCloudinary(fileUploadStatus.Item2);
                if (!deleteImageFromCloudinary)
                {
                    _logger.LogError(ex , "Error while delete image from Cloudinary");
                }
            }
            if (ex is appException)
            {
                throw;
            }
            _logger.LogError(ex , "There's a error while edit movie");
            throw systemException.SystemExceptionCaller();
        }
    }

    public async Task<baseResponse<string>> DeleteItem(Guid itemId)
    {
        return null!;
    }
}