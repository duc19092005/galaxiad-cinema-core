using BusinessLayer.Services.IdentityAccess;
using BusinessLayer.UseCases.IdentityAccess;

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
        
        // Google OAuth2
        services.AddHttpClient();
        services.AddScoped<GoogleLoginUseCase>();
        services.AddScoped<GoogleLoginService>();

        return services;
    }
}
