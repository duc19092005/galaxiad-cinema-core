using DataAccess;
using Microsoft.EntityFrameworkCore;

namespace BusinessLayer.Validators.MovieManager;

public static class MovieInfoValidate
{
    public static async Task<bool> IsExistMovieName(CinemaDbContext dbContext , string movieName , Guid? movieId)
    {
        if (movieId != null)
        {
            return await dbContext.MovieInfoEntity.FirstOrDefaultAsync(x =>
                x.MovieName == movieName && x.MovieId != movieId && !x.IsDeleted) != null;
        }
        else
        {
            return await dbContext.MovieInfoEntity.FirstOrDefaultAsync(x =>
                x.MovieName == movieName && !x.IsDeleted) != null;
        }
    }
    
    public static async Task<bool> IsExistMovieDescription(CinemaDbContext dbContext , string movieDescriptions , Guid? movieId)
    {
        if (movieId != null)
        {
            return await dbContext.MovieInfoEntity.FirstOrDefaultAsync(x =>
                x.MovieDescription == movieDescriptions && x.MovieId != movieId
                                                        && !x.IsDeleted) != null;
        }
        else
        {
            return await dbContext.MovieInfoEntity.FirstOrDefaultAsync(x =>
                x.MovieDescription == movieDescriptions
                && !x.IsDeleted) != null;
        }
    }
}
