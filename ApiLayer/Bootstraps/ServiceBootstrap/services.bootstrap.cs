// ReSharper disable All

using BussinessLayer.Services.facilities_manager;
using BussinessLayer.Services.facilities_manager.Auditoriums;
using BussinessLayer.Services.facilities_manager.Movie_Infos.Movie_format;
using BussinessLayer.Services.Identity_access;

namespace Backend.Bootstraps.ServiceBootstrap;

public static class services_bootstrap
{
    public static IServiceCollection AddServices(this IServiceCollection services)
    {
        services.AddScoped<registerService>();
        services.AddScoped<loginService>();
        services.AddScoped<facilitiesManagerWriteCinemaService>();
        services.AddScoped<facilitiesManagerReadCinemaService>();
        services.AddScoped<facilitiesManagerWriteAuditoriumService>();
        services.AddScoped<facilitiesManagerReadMovieFormatService>();
        services.AddScoped<facilitiesManagerReadAuditoriumService>();
        services.AddScoped<userProfileService>();
        return services;
    }
}