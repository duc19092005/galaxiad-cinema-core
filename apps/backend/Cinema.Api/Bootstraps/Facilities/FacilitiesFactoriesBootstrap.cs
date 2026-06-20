using Cinema.Application.Dtos.FacilitiesManager.Auditoriums.Requests;
using Cinema.Application.Dtos.FacilitiesManager.Auditoriums.Responses;
using Cinema.Application.Dtos.FacilitiesManager.Cinemas.Requests;
using Cinema.Application.Dtos.FacilitiesManager.Cinemas.Responses;
using Cinema.Application.Dtos.TheaterManager.MovieSchedules.Requests;
using Cinema.Application.Interfaces.ICinema;
using Cinema.Application.Interfaces.IIdentityAccess;
using Cinema.Application.UseCases.FacilitiesManager.Auditoriums;
using Cinema.Application.UseCases.FacilitiesManager.Cinemas;
using Cinema.Application.UseCases.FacilitiesManager.MovieFormat;
using Cinema.Application.UseCases.IdentityAccess;
using Cinema.Application.UseCases.TheaterManager.MovieSchedules;

namespace Cinema.Api.Bootstraps.Facilities;

public static class FacilitiesFactoriesBootstrap
{
    public static IServiceCollection AddFacilitiesFactories(this IServiceCollection services)
    {
        return services;
    }
}
