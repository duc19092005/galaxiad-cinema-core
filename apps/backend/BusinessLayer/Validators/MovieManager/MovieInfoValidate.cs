using BusinessLayer.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace BusinessLayer.Validators.MovieManager;

public static class MovieInfoValidate
{
    public static async Task<bool> IsExistMovieName(IQueryable<MovieInfoEntity> movies, string movieName , Guid? movieId)
    {
        if (movieId != null)
        {
            return await movies.AnyAsync(x =>
                x.MovieName == movieName && x.MovieId != movieId && !x.IsDeleted);
        }
        else
        {
            return await movies.AnyAsync(x =>
                x.MovieName == movieName && !x.IsDeleted);
        }
    }
    
    public static async Task<bool> IsExistMovieDescription(IQueryable<MovieInfoEntity> movies, string movieDescriptions , Guid? movieId)
    {
        if (movieId != null)
        {
            return await movies.AnyAsync(x =>
                x.MovieDescription == movieDescriptions && x.MovieId != movieId
                                                        && !x.IsDeleted);
        }
        else
        {
            return await movies.AnyAsync(x =>
                x.MovieDescription == movieDescriptions
                && !x.IsDeleted);
        }
    }
}
