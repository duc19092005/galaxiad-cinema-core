using BussinessLayer.Dtos.facilities_manager.Auditoriums;
using BussinessLayer.Dtos.facilities_manager.Cinemas;
using BussinessLayer.Dtos.Movie_Manager;
using BussinessLayer.Interfaces.i_Behaviors;
using BussinessLayer.Use_cases.facilities_manager.Auditoriums;
using BussinessLayer.Use_cases.facilities_manager.Cinemas;
using BussinessLayer.Use_cases.Movie_Manager.Movie_Infos;

namespace Backend.Bootstraps.FactoryBootstrap.Movie_Manager;

public static class factoryMovieManagerBootstrap
{
    public static IServiceCollection MovieManagerWriteFactory(this IServiceCollection services)
    {
        services
            .AddScoped<IWriteBehavior<reqAddMovieManagerMovieDto, reqEditMovieManagerMovieDto, string>,
                movieManagerWriteMovieInfosUseCase>();
        return services;
    }
    
    public static IServiceCollection MovieManagerReadMovieFactory(this IServiceCollection services)
    {
        return services;
    }
}