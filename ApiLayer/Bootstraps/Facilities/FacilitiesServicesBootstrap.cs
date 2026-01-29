using BusinessLayer.Services.FacilitiesManager.Cinemas;
using BusinessLayer.Services.FacilitiesManager.Auditoriums;
using BusinessLayer.Services.FacilitiesManager.MovieInfos.MovieFormats;

namespace ApiLayer.Bootstraps.Facilities;

public static class FacilitiesServicesBootstrap
{
    public static IServiceCollection AddFacilitiesServices(this IServiceCollection services)
    {
        // ----------------------------------------------------------------
        // |                 Facilities Manager Services                  |
        // ----------------------------------------------------------------

        services.AddScoped<FacilitiesManagerWriteCinemaService>();
        services.AddScoped<FacilitiesManagerReadCinemaService>();
        services.AddScoped<FacilitiesManagerWriteAuditoriumService>();
        services.AddScoped<FacilitiesManagerReadMovieFormatService>();
        services.AddScoped<FacilitiesManagerReadAuditoriumService>();

        return services;
    }
}
