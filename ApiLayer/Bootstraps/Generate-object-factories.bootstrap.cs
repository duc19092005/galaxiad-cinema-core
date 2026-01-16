// ReSharper disable All

using BussinessLayer.Dtos.Auditoriums.facilities_manager;
using BussinessLayer.Dtos.cinemas;
using BussinessLayer.Dtos.cinemas.facilities_manager;
using BussinessLayer.Dtos.Identity_Access;
using BussinessLayer.Dtos.Movie_Infos.Movie_Format;
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

    public static IServiceCollection addWriteObjectsFactory(this IServiceCollection services)
    {
        services.AddScoped<IWriteBehavior<add_cinema_req_dto, edit_cinema_req_dto, string>, facilitiesManagerWriteCinemaUseCase>();
        services
            .AddScoped<IWriteBehavior<add_req_auditorium_dto, edit_req_auditorium_dto, string>,
                facilitiesManagerWriteAuditoriumUseCase>(); 
        return services;
    }

    public static IServiceCollection addReadObjectsFactoryFacilitiesManager(this IServiceCollection services)
    {
        services
            .AddScoped<IReadBehavior<res_facilities_manager_cinema>, facilitiesManagerReadCinemaUseCase>();
        services
            .AddScoped<IReadBehavior<facilities_manager_res_movie_format_dto>,
                facilitiesManagerReadMovieFormatUseCase>();
        services
            .AddScoped<IReadBehavior<get_res_auditorium_dto>, facilitiesManagerReadAuditoriumUseCase>();
        
        
        services.AddScoped<ICinemaBehavior<GetResAuditoriumDtoCinema> , facilitiesManagerReadAuditoriumUseCase>();

        services.AddScoped<IProfileBehavior, identityAccessUserProfileUseCase>();
        

        return services;
    }
}