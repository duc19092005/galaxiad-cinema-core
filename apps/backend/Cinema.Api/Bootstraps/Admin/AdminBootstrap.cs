using Cinema.Infrastructure.Services;
using Cinema.Application.UseCases.Admin;
using Cinema.Application.UseCases.Admin.Audit;
using Cinema.Application.UseCases.Admin.Dashboard;
using Cinema.Application.UseCases.Admin.Transfers;

namespace Cinema.Api.Bootstraps.Admin;

public static class AdminBootstrap
{
    public static IServiceCollection AddAdminBootstrap(this IServiceCollection services)
    {
        // Schedule Jobs
        services.AddScoped<IAdminReadScheduleBehavior, AdminReadScheduleUseCase>();

        // Dashboard Use Case
        services.AddScoped<GetManagementDashboardUseCase>();

        // Audit Use Case
        services.AddScoped<GetRecentAuditLogsUseCase>();
        // Keep AuditLogService since it's also used by other services for WriteAsync
        services.AddScoped<AuditLogService>();

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
