// ReSharper disable All

using BussinessLayer.Factories;
using BussinessLayer.Factories.Identity_access;
using BussinessLayer.Interfaces.i_cinema;

namespace Backend.Bootstraps.FactoryBootstrap;

public static class Factories_Bootstrap
{
    public static IServiceCollection addApplicationFactories(this IServiceCollection services)
    {
        services.AddScoped<write_factory>();
        services.AddScoped<read_factory>();
        services.AddScoped<readCinemaFactory>();
        return services; 
    }
}