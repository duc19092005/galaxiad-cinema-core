using BusinessLayer.Services.MovieManager;

namespace ApiLayer.Bootstraps.MovieInfos;

public static class MovieServicesBootstrap
{
    public static IServiceCollection AddMovieServices(this IServiceCollection services)
    {
        services.AddScoped<MovieManagerWriteMovieService>();
        return services;
    }
}
