using System.Security.Claims;
using Backend.Shard.Exceptions;
using BussinessLayer.Dtos;
using BussinessLayer.Dtos.Movie_Manager;
using BussinessLayer.Interfaces.i_Behaviors;
using BussinessLayer.Validates.Movie_Manager;
using DataAccess;
using DataAccess.Entities.Movie_infos;
using Microsoft.AspNetCore.Http;
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
                await movieInfoValidate.IsExistMovieName(_dbContext, request.MovieDescription, null);
            
            var isExitsMovieDescription =
                await movieInfoValidate.IsExistMovieDescription(_dbContext, request.MovieDescription, null);
            
            if (isExitsMovieName)
            {
                throw new appException("Movie Name is already in use" , 400 , "E01");
            }
            else if(isExitsMovieDescription)
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
                activeAt = request.StartedDate,
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

            _logger.LogError(ex, "Lỗi nghiêm trọng khi tạo phim");
            
            throw systemException.SystemExceptionCaller();
        }
    }

    public async Task<baseResponse<string>> UpdateItem(Guid itemId, reqEditMovieManagerMovieDto request)
    {
        return null!;
    }

    public async Task<baseResponse<string>> DeleteItem(Guid itemId)
    {
        return null!;
    }
}