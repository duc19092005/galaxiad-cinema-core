using BusinessLayer.Dtos.MovieManager;
using BusinessLayer.Interfaces.IBehaviors;
using BusinessLayer.UseCases.MovieManager.MovieInfos;

namespace ApiLayer.Bootstraps.MovieInfos;

public static class MovieFactoriesBootstrap
{
    public static IServiceCollection AddMovieFactories(this IServiceCollection services)
    {
        services
            .AddScoped<IWriteBehavior<ReqAddMovieManagerMovieDto, ReqEditMovieManagerMovieDto, string>,
                WriteMovieInfosUseCase>();
        
        return services;
    }
}
