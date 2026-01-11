using BussinessLayer.Services.Identity_access;

namespace Backend.Bootstraps;

public static class services_bootstrap
{
    public static IServiceCollection AddServices(this IServiceCollection services)
    {
        services.AddScoped<register_service>();
        services.AddScoped<login_service>();
        return services;
    }
}