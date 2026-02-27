using BusinessLayer.Services.Admin.ScheduleJobs;
using BusinessLayer.UseCases.Admin;

namespace ApiLayer.Bootstraps.Admin;

public static class AdminBootstrap
{
    public static IServiceCollection AddAdminBootstrap(this IServiceCollection services)
    {
        services.AddScoped<IAdminReadScheduleBehavior, AdminReadScheduleUseCase>();
        services.AddScoped<AdminReadScheduleJobService>();
        return services;
    }
}