// ReSharper disable All

using BussinessLayer.Dtos.Auditoriums.facilities_manager;
using BussinessLayer.Dtos.cinemas;
using BussinessLayer.Dtos.cinemas.facilities_manager;
using BussinessLayer.Dtos.Identity_Access;
using BussinessLayer.Dtos.Movie_Infos.Movie_Format;
using BussinessLayer.Interfaces.facilities_manager.auditoriums;
using BussinessLayer.Interfaces.i_Behaviors;
using BussinessLayer.Interfaces.i_cinema;
using BussinessLayer.Interfaces.i_identity_access;
using BussinessLayer.Services.facilities_manager.Auditoriums;
using BussinessLayer.Use_cases.facilities_manager;
using BussinessLayer.Use_cases.facilities_manager.Auditoriums;
using BussinessLayer.Use_cases.facilities_manager.Movie_Format;
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
        services
            .AddScoped<i_write_behavior<add_req_auditorium_dto, edit_req_auditorium_dto, string>,
                write_auditorium_usecase>(); 
        return services;
    }

    public static IServiceCollection addReadObjectsFactoryFacilitiesManager(this IServiceCollection services)
    {
        services
            .AddScoped<i_read_behavior<res_facilities_manager_cinema>, read_use_case_facilities_manager>();
        services
            .AddScoped<i_read_behavior<facilities_manager_res_movie_format_dto>,
                facilities_manager_movie_format_info_usecase>();
        services
            .AddScoped<i_read_behavior<get_res_auditorium_dto>, read_auditorium_usecase>();
        
        services.AddScoped<i_auditorium, read_auditorium_usecase>();
        
        services.AddScoped<get_access_use_case>();
        
        services.AddScoped<i_cinema_behavior<get_res_auditorium_dto> , read_auditorium_usecase>();

        return services;
    }
}