using BusinessLayer.Services.FacilitiesManager.Cinemas;
using BusinessLayer.Services.FacilitiesManager.Auditoriums;
using BusinessLayer.Services.FacilitiesManager.MovieInfos.MovieFormats;
using BusinessLayer.Services.TheaterManager.MovieSchedules;

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
        services.AddScoped<TheaterManagerWriteSchedulesService>();

        return services;
    }
}
