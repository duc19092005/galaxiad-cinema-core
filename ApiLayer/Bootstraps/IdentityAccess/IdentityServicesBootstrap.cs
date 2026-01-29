using BusinessLayer.Services.IdentityAccess;

namespace ApiLayer.Bootstraps.IdentityAccess;

public static class IdentityServicesBootstrap
{
    public static IServiceCollection AddIdentityServices(this IServiceCollection services)
    {
        // ----------------------------------------------------------------
        // |                 Identity Access Services                     |
        // ----------------------------------------------------------------
        
        services.AddScoped<RegisterService>();
        services.AddScoped<LoginService>();
        services.AddScoped<UserProfileService>();

        return services;
    }
}
