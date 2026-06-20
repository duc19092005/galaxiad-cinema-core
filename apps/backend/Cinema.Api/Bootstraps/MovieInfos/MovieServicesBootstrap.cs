using Cinema.Application.UseCases.MovieManager.MovieInfos;

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

        return services;
    }
}
