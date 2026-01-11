using BussinessLayer.Factories.Identity_access;

namespace Backend.Bootstraps;

public static class Factories_Bootstrap
{
    public static IServiceCollection addApplicationFactories(this IServiceCollection services)
    {
        services.AddScoped<register_factory>();
        services.AddScoped<login_factory>();
        return services; 
    }
}