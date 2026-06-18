using BusinessLayer.Services.Admin.ScheduleJobs;
using BusinessLayer.Services.Admin.Audit;
using BusinessLayer.Services.Admin.Dashboard;
using BusinessLayer.UseCases.Admin;

namespace ApiLayer.Bootstraps.Admin;

public static class AdminBootstrap
{
    public static IServiceCollection AddAdminBootstrap(this IServiceCollection services)
    {
        services.AddScoped<IAdminReadScheduleBehavior, AdminReadScheduleUseCase>();
        services.AddScoped<AdminReadScheduleJobService>();
        services.AddScoped<AuditLogService>();
        services.AddScoped<ManagementDashboardService>();
        services.AddScoped<BusinessLayer.Services.Admin.UserManagement.AdminManageUserService>();
        services.AddScoped<BusinessLayer.Services.Admin.UserManagement.AdminManagementTransferService>();
        return services;
    }
}
