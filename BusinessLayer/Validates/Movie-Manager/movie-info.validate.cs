using DataAccess;
using Microsoft.EntityFrameworkCore;

namespace BussinessLayer.Validates.Movie_Manager;

public static class movieInfoValidate
{
    public static async Task<bool> IsExistMovieName(cinemaDbContext dbContext , string movieName , Guid? movieId)
    {
        if (movieId != null)
        {
            return await dbContext.movieInfoEntity.FirstOrDefaultAsync(x =>
                x.movieName == movieName && x.movieId != movieId && !x.isDeleted) != null;
        }
        else
        {
            return await dbContext.movieInfoEntity.FirstOrDefaultAsync(x =>
                x.movieName == movieName && !x.isDeleted) != null;
        }
    }
    
    public static async Task<bool> IsExistMovieDescription(cinemaDbContext dbContext , string movieDescriptions , Guid? movieId)
    {
        if (movieId != null)
        {
            return await dbContext.movieInfoEntity.FirstOrDefaultAsync(x =>
                x.movieDescription == movieDescriptions && x.movieId != movieId
                                                        && !x.isDeleted) != null;
        }
        else
        {
            return await dbContext.movieInfoEntity.FirstOrDefaultAsync(x =>
                x.movieDescription == movieDescriptions
                && !x.isDeleted) != null;
        }
    }
}