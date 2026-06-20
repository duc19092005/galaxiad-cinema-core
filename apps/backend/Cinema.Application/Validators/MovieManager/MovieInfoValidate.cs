using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Domain.Entities.MovieInfos;

namespace Cinema.Application.Validators.MovieManager;

public static class MovieInfoValidate
{
    public static Task<bool> IsExistMovieName(IEnumerable<MovieInfoEntity> movies, string movieName , Guid? movieId)
    {
        if (movieId != null)
        {
            return Task.FromResult(movies.Any(x =>
                x.MovieName == movieName && x.MovieId != movieId && !x.IsDeleted));
        }
        else
        {
            return Task.FromResult(movies.Any(x =>
                x.MovieName == movieName && !x.IsDeleted));
        }
    }
    
    public static Task<bool> IsExistMovieDescription(IEnumerable<MovieInfoEntity> movies, string movieDescriptions , Guid? movieId)
    {
        if (movieId != null)
        {
            return Task.FromResult(movies.Any(x =>
                x.MovieDescription == movieDescriptions && x.MovieId != movieId
                                                        && !x.IsDeleted));
        }
        else
        {
            return Task.FromResult(movies.Any(x =>
                x.MovieDescription == movieDescriptions
                && !x.IsDeleted));
        }
    }
}
