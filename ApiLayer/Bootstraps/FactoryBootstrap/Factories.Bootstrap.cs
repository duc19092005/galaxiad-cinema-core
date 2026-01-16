// ReSharper disable All

using BussinessLayer.Factories;
using BussinessLayer.Factories.ApplicationFactories;
using BussinessLayer.Factories.Identity_access;
using BussinessLayer.Interfaces.i_cinema;

namespace Backend.Bootstraps.FactoryBootstrap;

public static class Factories_Bootstrap
{
    public static IServiceCollection AddApplicationFactories(this IServiceCollection services)
    {
        services.AddScoped<write_factory>();
        services.AddScoped<read_factory>();
        services.AddScoped<readDataFromCinemaFactory>();
        return services; 
    }
}