using BusinessLayer.Dtos.MovieManager.Requests;
using BusinessLayer.Dtos.MovieManager.Responses;
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

        services.AddScoped<IReadBehavior<ResGetMovieInfosMovieManagerDto> , ReadMovieInfoUseCase>();
        
        return services;
    }
}
