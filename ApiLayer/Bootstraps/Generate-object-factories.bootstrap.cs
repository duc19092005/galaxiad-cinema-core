// ReSharper disable All

using BussinessLayer.Dtos.cinemas;
using BussinessLayer.Dtos.cinemas.facilities_manager;
using BussinessLayer.Dtos.Identity_Access;
using BussinessLayer.Interfaces.i_Behaviors;
using BussinessLayer.Interfaces.i_identity_access;
using BussinessLayer.Use_cases.facilities_manager;
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

    public static IServiceCollection addWriteObjectsFactory(this IServiceCollection services)
    {
        services.AddScoped<i_write_behavior<add_cinema_req_dto, edit_cinema_req_dto, string>, write_use_case>();
        return services;
    }

    public static IServiceCollection addReadObjectsFactoryFacilitiesManager(this IServiceCollection services)
    {
        services.AddScoped<i_read_behavior<res_facilities_manager_cinema>, read_use_case_facilities_manager>();
        return services;
    }
}