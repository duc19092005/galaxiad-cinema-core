using BusinessLayer.Factories;
using BusinessLayer.Factories.ApplicationFactories;
using BusinessLayer.Factories.IdentityAccess;
using BusinessLayer.Interfaces.ICinema;

namespace ApiLayer.Bootstraps.Common;

public static class ApplicationFactoriesBootstrap
{
    public static IServiceCollection AddApplicationFactories(this IServiceCollection services)
    {
        services.AddScoped<WriteFactory>();
        services.AddScoped<ReadFactory>();
        services.AddScoped<ReadDataFromCinemaFactory>();
        return services; 
    }
}
