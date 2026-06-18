using BusinessLayer.Dtos.IdentityAccess.Requests;
using BusinessLayer.Dtos.IdentityAccess.Responses;
using BusinessLayer.Factories.IdentityAccess;
using BusinessLayer.Interfaces.IIdentityAccess;
using BusinessLayer.UseCases.IdentityAccess;

namespace ApiLayer.Bootstraps.IdentityAccess;

public static class IdentityFactoriesBootstrap
{
    public static IServiceCollection AddIdentityFactories(this IServiceCollection services)
    {
        // Register Factory
        services.AddScoped<RegisterFactory>();
        services.AddScoped<IAddBehavior<ReqRegularRegisterDto, string>, IdentityAccessRegularRegisterUseCase>();
        
        // Login Factory
        services.AddScoped<LoginFactory>();
        services.AddScoped<ILogin<ReqRegularLoginDto , ResRegularLoginDto> , identityAccessRegularLoginUseCase>();
        
        // User Profile
        services.AddScoped<IProfileBehavior, UserProfileUseCase>();
        
        return services; 
    }
}
