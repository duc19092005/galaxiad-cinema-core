using Cinema.Infrastructure.ExternalServices;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Admin;
using Cinema.Infrastructure.Persistence.Repositories.Admin;
using Cinema.Application.UseCases.Admin;
using Cinema.Application.UseCases.Admin.Audit;
using Cinema.Application.UseCases.Admin.Dashboard;
using Cinema.Application.UseCases.Admin.Transfers;
using Cinema.Application.UseCases.Admin.UserManagement;
using Cinema.Application.Interfaces.Banners;
using Cinema.Infrastructure.Persistence.Repositories.Banners;
using Cinema.Application.UseCases.Admin.Banners;
using Cinema.Application.UseCases.Public;
using Cinema.Infrastructure.BackgroundJobs.Banners;
using Cinema.Infrastructure.ExternalServices.Cache;
using Cinema.Application.Interfaces.AiResearch;
using Cinema.Infrastructure.ExternalServices.Ai;

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
        services.AddScoped<Cinema.Application.Interfaces.Admin.IAdminUserRepository, Cinema.Infrastructure.Persistence.Repositories.Admin.AdminUserRepository>();
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
        services.AddScoped<Cinema.Application.UseCases.Admin.UserManagement.AdminUpdateUserProfileUseCase>();

        // Banners
        services.AddScoped<IBannerRepository, BannerRepository>();
        services.AddScoped<GetAllBannersUseCase>();
        services.AddScoped<GetBannerByIdUseCase>();
        services.AddScoped<CreateBannerUseCase>();
        services.AddScoped<UpdateBannerUseCase>();
        services.AddScoped<DeleteBannerUseCase>();
        services.AddScoped<ToggleBannerUseCase>();
        services.AddScoped<GetBannerScopeUseCase>();
        services.AddScoped<GetActiveBannersUseCase>();
        services.AddScoped<BannerCleanupJob>();
        services.AddScoped<MovieInterestSyncJob>();
        services.AddScoped<AutoGenerateBannersJob>();
        services.AddSingleton<IMovieInterestBuffer, MovieInterestBuffer>();

        // AI business research
        services.AddScoped<IAiResearchService, AiResearchService>();
        services.AddScoped<AiResearchService>();

        return services;
    }
}
