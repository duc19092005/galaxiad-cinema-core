using BussinessLayer.Factories;
using BussinessLayer.Factories.Identity_access;

namespace Backend.Bootstraps;

public static class Factories_Bootstrap
{
    public static IServiceCollection addApplicationFactories(this IServiceCollection services)
    {
        services.AddScoped<register_factory>();
        services.AddScoped<login_factory>();
        services.AddScoped<write_factory>();
        return services; 
    }
}