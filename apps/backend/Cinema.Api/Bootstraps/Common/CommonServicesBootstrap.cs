using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Infrastructure.Services;
using Cinema.Infrastructure.Repositories;
using Cinema.Infrastructure.Identity;
using Cinema.Infrastructure.BackgroundJobs;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;
using StackExchange.Redis;
using Microsoft.Extensions.Configuration;
using Cinema.Application.UseCases.Staff;
using Cinema.Application.UseCases.TheaterManager;
using Cinema.Application.Interfaces.Comments;
using Cinema.Application.UseCases.Comments;

namespace Cinema.Api.Bootstraps.Common;

public static class CommonServicesBootstrap
{
    public static IServiceCollection AddCommonServices(this IServiceCollection services)
    {
        // ----------------------------------------------------------------
        // |                   Cinema.Domain Utils Services                      |
        // ----------------------------------------------------------------
        
        services.AddScoped<IUserContextService, UserContextService>();
        
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
        services.AddScoped<ICommentModerationService, DeepSeekModerationService>();
        services.AddScoped<IMovieCommentRepository, MovieCommentRepository>();
        services.AddScoped<GetMovieCommentsUseCase>();
        services.AddScoped<GetCommentEligibilityUseCase>();
        services.AddScoped<CreateMovieCommentUseCase>();
        services.AddScoped<CreateMovieReplyUseCase>();
        services.AddScoped<ModerateMovieCommentUseCase>();
        services.AddScoped<DeleteOwnCommentUseCase>();
        services.AddScoped<GetMyNotificationsUseCase>();
        services.AddScoped<MarkNotificationAsReadUseCase>();
        services.AddScoped<GetTrendingMoviesUseCase>();
        services.AddScoped<GetTopRatedMoviesUseCase>();
        services.AddScoped<TrackMovieViewUseCase>();

        services.AddScoped<AiMovieEmbeddingSyncService>();

        // Register Shift Use Cases
        services.AddScoped<RegisterShiftUseCase>();
        services.AddScoped<ApproveShiftRegistrationUseCase>();
        services.AddScoped<RegisterFaceUseCase>();
        services.AddScoped<ClockInUseCase>();
        services.AddScoped<ClockOutUseCase>();
        services.AddScoped<CalculatePayrollUseCase>();

        services.AddHttpClient();
        
        return services;
    }
}
