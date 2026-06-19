using Cinema.Application.UseCases.MovieManager.MovieInfos;

namespace Cinema.Api.Bootstraps.MovieInfos;

public static class MovieServicesBootstrap
{
    public static IServiceCollection AddMovieServices(this IServiceCollection services)
    {
        // ----------------------------------------------------------------
        // |                 Movie Manager Use Cases                       |
        // ----------------------------------------------------------------

        services.AddScoped<WriteMovieInfosUseCase>();
        services.AddScoped<ReadMovieInfoUseCase>();

        return services;
    }
}
