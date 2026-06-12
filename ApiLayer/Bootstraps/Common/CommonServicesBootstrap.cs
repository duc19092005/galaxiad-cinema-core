using BusinessLayer.Services.ApplicationServices;
using BusinessLayer.Services.IdentityAccess;
using BusinessLayer.Interfaces.IThirdPersonServices;
using DataAccess.Services;
using DataAccess.Repositories;
using Shared.Interfaces.Persistence;
using Shared.Localization;

namespace ApiLayer.Bootstraps.Common;

public static class CommonServicesBootstrap
{
    public static IServiceCollection AddCommonServices(this IServiceCollection services)
    {
        // ----------------------------------------------------------------
        // |                   Shared Utils Services                      |
        // ----------------------------------------------------------------
        
        services.AddScoped<IUserContextService, UserContextservice>();
        
        // ----------------------------------------------------------------
        // |                   Localization Services                      |
        // ----------------------------------------------------------------
        
        services.AddScoped<ILocalizationService, LocalizationService>();
        
        // ----------------------------------------------------------------
        // |                   Schedules JobServices                      |
        // ----------------------------------------------------------------
        
        services.AddScoped<IScheduleJobsService ,  ScheduleJobsService>();
        
        
        services.AddScoped<ISha256Services , Sha256Service>();
        
        services.AddScoped<IVnPayService , VnpayService>();

        services.AddScoped<IUnitOfWork, EfUnitOfWork>();
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        
        return services;
    }
}
