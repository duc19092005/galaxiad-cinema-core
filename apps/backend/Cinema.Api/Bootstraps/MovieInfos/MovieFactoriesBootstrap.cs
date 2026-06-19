using Cinema.Application.Dtos.MovieManager.Requests;
using Cinema.Application.Dtos.MovieManager.Responses;
using Cinema.Application.Interfaces.IBehaviors;
using Cinema.Application.UseCases.MovieManager.MovieInfos;

namespace Cinema.Api.Bootstraps.MovieInfos;

public static class MovieFactoriesBootstrap
{
    public static IServiceCollection AddMovieFactories(this IServiceCollection services)
    {
        return services;
    }
}
