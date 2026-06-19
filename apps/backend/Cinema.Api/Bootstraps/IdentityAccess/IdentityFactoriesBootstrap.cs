using Cinema.Application.Dtos.IdentityAccess.Requests;
using Cinema.Application.Dtos.IdentityAccess.Responses;
using Cinema.Application.Interfaces.IIdentityAccess;
using Cinema.Application.UseCases.IdentityAccess;

namespace Cinema.Api.Bootstraps.IdentityAccess;

public static class IdentityFactoriesBootstrap
{
    public static IServiceCollection AddIdentityFactories(this IServiceCollection services)
    {
        return services; 
    }
}
