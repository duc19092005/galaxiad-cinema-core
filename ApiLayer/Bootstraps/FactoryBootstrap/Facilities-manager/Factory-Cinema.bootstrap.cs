using BussinessLayer.Dtos.facilities_manager.Auditoriums;
using BussinessLayer.Dtos.facilities_manager.Cinemas;
using BussinessLayer.Interfaces.i_Behaviors;
using BussinessLayer.Use_cases.facilities_manager.Auditoriums;
using BussinessLayer.Use_cases.facilities_manager.Cinemas;

namespace Backend.Bootstraps.FactoryBootstrap.Facilities_manager;

public static class factoryCinemaBootstrap
{
    public static IServiceCollection FacilitiesManagerCinemaAddWriteFactory(this IServiceCollection services)
    {
        services
            .AddScoped<IWriteBehavior<add_cinema_req_dto, edit_cinema_req_dto, string>,
                facilitiesManagerWriteCinemaUseCase>();
        services
            .AddScoped<IWriteBehavior<add_req_auditorium_dto, edit_req_auditorium_dto, string>,
                facilitiesManagerWriteAuditoriumUseCase>();
        return services;
    }

    public static IServiceCollection FacilitiesManagerCinemaAddReadFactory(this IServiceCollection services)
    {
        return services;
    }

}