using Cinema.Infrastructure.Services;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Admin;
using Cinema.Infrastructure.Repositories;
using Cinema.Application.UseCases.Admin;
using Cinema.Application.UseCases.Admin.Audit;
using Cinema.Application.UseCases.Admin.Dashboard;
using Cinema.Application.UseCases.Admin.Transfers;

namespace Cinema.Api.Bootstraps.Admin;

public static class AdminBootstrap
{
    public static IServiceCollection AddAdminBootstrap(this IServiceCollection services)
    {
        services.AddScoped<IAdminScheduleJobRepository, AdminScheduleJobRepository>();
        services.AddScoped<IAdminAccessScopeRepository, AdminAccessScopeRepository>();
        services.AddScoped<IAdminAuditLogRepository, AdminAuditLogRepository>();
        services.AddScoped<IAdminDashboardRepository, AdminDashboardRepository>();
        services.AddScoped<IAdminTransferRepository, AdminTransferRepository>();
        services.AddScoped<IAdminMovieManagementRepository, AdminMovieManagementRepository>();

        // Schedule Jobs
        services.AddScoped<IAdminReadScheduleBehavior, AdminReadScheduleUseCase>();

        // Dashboard Use Case
        services.AddScoped<GetManagementDashboardUseCase>();

        // Audit Use Case
        services.AddScoped<GetRecentAuditLogsUseCase>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<AuditLogService>(sp => (AuditLogService)sp.GetRequiredService<IAuditLogService>());

        // Transfer Use Cases
        services.AddScoped<GetUsersByRoleUseCase>();
        services.AddScoped<GetManagedItemsUseCase>();
        services.AddScoped<TransferManagementUseCase>();

        // Admin User Management
        services.AddScoped<Cinema.Application.Interfaces.Admin.IAdminUserRepository, Cinema.Infrastructure.Repositories.AdminUserRepository>();
        services.AddScoped<Cinema.Application.UseCases.Admin.UserManagement.GetAllUsersUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Admin.UserManagement.SetUserStatusUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Admin.UserManagement.UpdateUserPortraitUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Admin.UserManagement.GetUserRolesUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Admin.UserManagement.AssignRoleToUserUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Admin.UserManagement.CreateUserUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Admin.UserManagement.AssignCinemaToManagerUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Admin.UserManagement.GetAssignableRolesUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Admin.UserManagement.GetAllPermissionsUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Admin.UserManagement.GetRolesPermissionsUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Admin.UserManagement.UpdateRolePermissionsUseCase>();

        return services;
    }
}
