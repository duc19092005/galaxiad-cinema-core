using BussinessLayer.Dtos.Auditoriums.facilities_manager;
using BussinessLayer.Dtos.cinemas;
using BussinessLayer.Dtos.cinemas.facilities_manager;
using BussinessLayer.Dtos.Movie_Infos.Movie_Format;
using BussinessLayer.Interfaces.i_Behaviors;
using BussinessLayer.Interfaces.i_cinema;
using BussinessLayer.Interfaces.i_identity_access;
using BussinessLayer.Use_cases.facilities_manager.Cinemas;
using BussinessLayer.Use_cases.facilities_manager.Auditoriums;
using BussinessLayer.Use_cases.facilities_manager.Movie_Format;
using BussinessLayer.Use_cases.Identity_access;

namespace Backend.Bootstraps;

public static class generateObjectFactoriesBootstrap
{

    public static IServiceCollection AddReadObjectsFactoryFacilitiesManager(this IServiceCollection services)
    {
        services
            .AddScoped<IReadBehavior<res_facilities_manager_cinema>, facilitiesManagerReadCinemaUseCase>();
        services
            .AddScoped<IReadBehavior<resFacilitiesManagerMovieFormatDto>,
                facilitiesManagerReadMovieFormatUseCase>();
        services
            .AddScoped<IReadBehavior<get_res_auditorium_dto>, facilitiesManagerReadAuditoriumUseCase>();
        
        
        services.AddScoped<ICinemaBehavior<GetResAuditoriumDtoCinema> , facilitiesManagerReadAuditoriumUseCase>();

        services.AddScoped<IProfileBehavior, identityAccessUserProfileUseCase>();
        

        return services;
    }
}