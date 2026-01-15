// ReSharper disable All

using BussinessLayer.Services.facilities_manager;
using BussinessLayer.Services.facilities_manager.Auditoriums;
using BussinessLayer.Services.facilities_manager.Movie_Infos.Movie_format;
using BussinessLayer.Services.Identity_access;

namespace Backend.Bootstraps;

public static class services_bootstrap
{
    public static IServiceCollection AddServices(this IServiceCollection services)
    {
        services.AddScoped<register_service>();
        services.AddScoped<login_service>();
        services.AddScoped<cinema_service>();
        services.AddScoped<facilities_manager_read_service>();
        services.AddScoped<add_auditorium_service>();
        services.AddScoped<facilities_manager_read_movie_format_service>();
        services.AddScoped<read_auditorium_service_auditorium_service>();
        return services;
    }
}