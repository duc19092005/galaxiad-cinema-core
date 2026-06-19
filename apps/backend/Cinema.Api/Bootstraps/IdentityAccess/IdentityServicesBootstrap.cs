using Cinema.Application.Interfaces.IIdentityAccess;
using Cinema.Application.UseCases.IdentityAccess;
using Cinema.Infrastructure.Identity;
using Cinema.Infrastructure.Repositories;

namespace Cinema.Api.Bootstraps.IdentityAccess;

public static class IdentityServicesBootstrap
{
    public static IServiceCollection AddIdentityServices(this IServiceCollection services)
    {
        // ----------------------------------------------------------------
        // |                 Identity Access Services                     |
        // ----------------------------------------------------------------
        
        // Identity infrastructure services
        services.AddScoped<IPasswordHasher, BCryptPasswordHasher>();
        services.AddScoped<IJwtService, JwtService>();

        // Repository
        services.AddScoped<IIdentityAccessRepository, IdentityAccessRepository>();

        // Use Cases
        services.AddScoped<IdentityAccessRegularRegisterUseCase>();
        services.AddScoped<identityAccessRegularLoginUseCase>();
        services.AddScoped<GoogleLoginInitUseCase>();
        services.AddScoped<GoogleLoginCallbackUseCase>();
        services.AddScoped<GetProfileUseCase>();
        services.AddScoped<ChangePasswordUseCase>();
        services.AddScoped<UpdateUserProfileUseCase>();
        
        // Google OAuth2 HttpClient
        services.AddHttpClient();

        return services;
    }
}
