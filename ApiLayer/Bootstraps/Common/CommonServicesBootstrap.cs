using BusinessLayer.Services.ApplicationServices;
using BusinessLayer.Services.IdentityAccess;
using BusinessLayer.Interfaces.IThirdPersonServices;
using DataAccess.Services;
using DataAccess.Repositories;
using Shared.Interfaces.Persistence;
using Shared.Localization;
using StackExchange.Redis;
using Microsoft.Extensions.Configuration;
using BusinessLayer.UseCases.Staff;
using BusinessLayer.UseCases.TheaterManager;
using BusinessLayer.Services.Comments;

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

        services.AddSingleton<IConnectionMultiplexer>(sp =>
        {
            var config = sp.GetRequiredService<IConfiguration>();
            var redisConnStr = config.GetConnectionString("RedisConnection") ?? "localhost:6379";
            return ConnectionMultiplexer.Connect(redisConnStr);
        });

        services.AddScoped<IRedisLockService, RedisLockService>();
        services.AddSingleton<ISseNotificationService, SseNotificationService>();
        services.AddScoped<DeepSeekModerationService>();
        services.AddScoped<MovieCommentService>();

        // Register Shift Use Cases
        services.AddScoped<RegisterShiftUseCase>();
        services.AddScoped<ApproveShiftRegistrationUseCase>();
        services.AddScoped<RegisterFaceUseCase>();
        services.AddScoped<ClockInUseCase>();
        services.AddScoped<ClockOutUseCase>();
        services.AddScoped<CalculatePayrollUseCase>();
        
        return services;
    }
}
