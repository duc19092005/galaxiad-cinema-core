using BussinessLayer.Dtos.Identity_Access;
using BussinessLayer.Factories;
using BussinessLayer.Factories.Identity_access;
using BussinessLayer.Interfaces.i_identity_access;
using BussinessLayer.Use_cases.Identity_access;

namespace Backend.Bootstraps.FactoryBootstrap.Identity_access;

public static class registerFactoryBootstrap
{
    public static IServiceCollection AddRegisterFactory(this IServiceCollection services)
    {
        services.AddScoped<registerFactory>();
        services.AddScoped<IAddBehavior<regular_register_request_dto, string>, identityAccessRegularRegisterUseCase>();
        return services; 
    }
}