using BussinessLayer.Dtos.Identity_Access;
using BussinessLayer.Interfaces;
using BussinessLayer.Interfaces.i_identity_access;
using BussinessLayer.Use_cases.Identity_access;

namespace Backend.Bootstraps;

public static class Generate_object_factories_bootstrap
{
    public static IServiceCollection addRegisterObjectsFactory(this IServiceCollection services)
    {
        services.AddScoped<IAddBehavior<regular_register_request_dto, string>, regular_register_use_case>();
        services.AddScoped<ILogin_interface<regular_login_req_dto , regular_login_res_dto> , login_regular_use_case>();
        return services; 
    }
}