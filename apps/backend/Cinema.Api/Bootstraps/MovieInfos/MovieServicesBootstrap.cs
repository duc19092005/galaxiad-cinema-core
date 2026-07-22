using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.UseCases.MovieManager.MovieInfos;
using Cinema.Infrastructure.ExternalServices.Tmdb;

namespace Cinema.Api.Bootstraps.MovieInfos;

public static class MovieServicesBootstrap
{
    public static IServiceCollection AddMovieServices(this IServiceCollection services)
    {
        // ----------------------------------------------------------------
        // |                 Movie Manager Use Cases                       |
        // ----------------------------------------------------------------

        services.AddScoped<CreateMovieUseCase>();
        services.AddScoped<UpdateMovieUseCase>();
        services.AddScoped<DeleteMovieUseCase>();
        services.AddScoped<GetMovieInfosUseCase>();
        services.AddScoped<GetMovieInfoByIdUseCase>();
        services.AddScoped<SetMovieActiveUseCase>();
        services.AddScoped<SetMovieInactiveUseCase>();

        // External public movie metadata (TMDB)
        services.AddHttpClient<ITmdbMovieClient, TmdbMovieClient>(client =>
        {
            client.BaseAddress = new Uri("https://api.themoviedb.org/3/");
            client.Timeout = TimeSpan.FromSeconds(20);
            client.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "application/json");
        });

        return services;
    }
}
