using BussinessLayer.Dtos.Identity_Access;
using BussinessLayer.Factories.Identity_access;
using BussinessLayer.Interfaces.i_identity_access;
using BussinessLayer.Use_cases.Identity_access;

namespace Backend.Bootstraps.FactoryBootstrap.Identity_access;

public static class loginFactoryBootstrap
{
    public static IServiceCollection LoginFactoryBootstrap(this IServiceCollection services)
    {
        services.AddScoped<loginFactory>();
        services.AddScoped<ILogin_interface<reqRegularLoginDto , resRegularLoginDto> , identityAccessRegularLoginUseCase>();
        return services; 
    }
}