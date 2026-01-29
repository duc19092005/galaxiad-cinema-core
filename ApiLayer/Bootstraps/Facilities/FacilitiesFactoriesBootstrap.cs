using BusinessLayer.Dtos.FacilitiesManager.Auditoriums;
using BusinessLayer.Dtos.FacilitiesManager.Cinemas;
using BusinessLayer.Dtos.FacilitiesManager.MovieInfos;
using BusinessLayer.Dtos.FacilitiesManager.MovieInfos.MovieFormats;
using BusinessLayer.Interfaces.IBehaviors;
using BusinessLayer.Interfaces.ICinema;
using BusinessLayer.Interfaces.IIdentityAccess;
using BusinessLayer.UseCases.FacilitiesManager.Cinemas;
using BusinessLayer.UseCases.FacilitiesManager.Auditoriums;
using BusinessLayer.UseCases.FacilitiesManager.MovieFormat;
using BusinessLayer.UseCases.IdentityAccess;

namespace ApiLayer.Bootstraps.Facilities;

public static class FacilitiesFactoriesBootstrap
{
    public static IServiceCollection AddFacilitiesFactories(this IServiceCollection services)
    {
        // Read Factories
        services
            .AddScoped<IReadBehavior<ResFacilitiesManagerCinema>, FacilitiesManagerReadCinemaUseCase>();
        services
            .AddScoped<IReadBehavior<ResFacilitiesManagerMovieFormatDto>,
                FacilitiesManagerReadMovieFormatUseCase>();
        services
            .AddScoped<IReadBehavior<GetResAuditoriumDto>, FacilitiesManagerReadAuditoriumUseCase>();
        
        services.AddScoped<ICinemaBehavior<GetResAuditoriumDtoCinema> , FacilitiesManagerReadAuditoriumUseCase>();

        services.AddScoped<IProfileBehavior, UserProfileUseCase>();

        // Write Factories
        services
            .AddScoped<IWriteBehavior<AddCinemaReqDto, EditCinemaReqDto, string>,
                FacilitiesManagerWriteCinemaUseCase>();
        services
            .AddScoped<IWriteBehavior<AddReqAuditoriumDto, EditReqAuditoriumDto, string>,
                FacilitiesManagerWriteAuditoriumUseCase>();

        return services;
    }
}
