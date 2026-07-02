using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Infrastructure.ExternalServices.Cache;
using Cinema.Infrastructure.Persistence.Repositories.Common;
using Cinema.Infrastructure.Persistence.Repositories.Booking;
using Cinema.Infrastructure.Persistence.Repositories.Catalog;
using Cinema.Infrastructure.Persistence.Repositories.Comments;
using Cinema.Infrastructure.Persistence.Repositories.Recommendations;
using Cinema.Infrastructure.Persistence.Repositories.Staff;
using Cinema.Infrastructure.Identity;
using Cinema.Infrastructure.BackgroundJobs;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;
using Cinema.Infrastructure.ExternalServices.Localization;
using Cinema.Infrastructure.ExternalServices.Jobs;
using Cinema.Infrastructure.ExternalServices.Security;
using Cinema.Infrastructure.ExternalServices.Payments;
using Cinema.Infrastructure.ExternalServices.Notifications;
using Cinema.Infrastructure.ExternalServices.Ai;
using StackExchange.Redis;
using Microsoft.Extensions.Configuration;
using Cinema.Application.UseCases.Staff;
using Cinema.Application.Interfaces.Staff;
using Cinema.Application.UseCases.TheaterManager.ShiftManagement;
using Cinema.Application.UseCases.TheaterManager.ShiftSchedules;
using Cinema.Application.Interfaces.Comments;
using Cinema.Application.UseCases.Customer.Engagement.Comments;
using Cinema.Application.UseCases.Customer.Engagement.Recommendation;
using Cinema.Application.Interfaces.Catalog;
using Cinema.Application.UseCases.Customer.Catalog;
using Cinema.Application.Interfaces.Booking;
using Cinema.Infrastructure.Persistence.Validation;
using Cinema.Application.UseCases.Admin;
using Cinema.Application.UseCases.Admin.ShiftSchedules;
using Cinema.Application.UseCases.Booking.BookingFlow;
using Cinema.Application.UseCases.Booking.UserHistory;

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
        services.AddScoped<IBookingBusinessRuleService, BookingBusinessRuleService>();
        services.AddScoped<IStaffRepository, StaffRepository>();

        services.AddSingleton<IConnectionMultiplexer>(sp =>
        {
            var config = sp.GetRequiredService<IConfiguration>();
            var redisConnStr = config.GetConnectionString("RedisConnection") ?? "localhost:6379";
            return ConnectionMultiplexer.Connect(redisConnStr);
        });

        services.AddScoped<IRedisLockService, RedisLockService>();
        services.AddScoped<IMovieCacheService, MovieCacheService>();
        services.AddScoped<IGroupBookingCacheService, GroupBookingCacheService>();
        services.AddSingleton<ISeatLockService, SeatLockService>();
        services.AddSingleton<IVoteTimeoutScheduler, VoteTimeoutScheduler>();
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
        services.AddScoped<IMovieViewBuffer, MovieViewBuffer>();

        // Recommendation & AI Sync Services
        services.AddScoped<IRecommendationRepository, RecommendationRepository>();
        services.AddScoped<AiMovieEmbeddingSyncService>();
        services.AddScoped<IAiMovieEmbeddingSyncService>(sp => sp.GetRequiredService<AiMovieEmbeddingSyncService>());
        services.AddScoped<GetRecommendationsUseCase>();
        services.AddScoped<GetSurveyStatusUseCase>();
        services.AddScoped<SaveSurveyUseCase>();
        services.AddScoped<SyncMoviesToAiServiceUseCase>();

        // Register Shift Use Cases
        services.AddScoped<RegisterShiftUseCase>();
        services.AddScoped<Cinema.Application.UseCases.TheaterManager.ShiftManagement.ShiftRegistrationResolver>();
        services.AddScoped<ApproveShiftRegistrationUseCase>();
        services.AddScoped<RejectShiftRegistrationUseCase>();
        services.AddScoped<CancelShiftRegistrationUseCase>();
        services.AddScoped<AssignShiftDirectlyUseCase>();
        services.AddScoped<RegisterFaceUseCase>();
        services.AddScoped<ClockInUseCase>();
        services.AddScoped<ClockOutUseCase>();
        services.AddScoped<CalculatePayrollUseCase>();
        services.AddScoped<PayPayrollUseCase>();
        services.AddScoped<CreateShiftScheduleUseCase>();
        services.AddScoped<GetShiftSchedulesUseCase>();
        services.AddScoped<DeleteShiftScheduleUseCase>();
        services.AddScoped<GetPendingDeletionRequestsUseCase>();
        services.AddScoped<ApproveDeletionRequestUseCase>();
        services.AddScoped<RejectDeletionRequestUseCase>();

        // Public Catalog Services
        services.AddScoped<IPublicCatalogRepository, PublicCatalogRepository>();
        services.AddScoped<GetMovieFormatsUseCase>();
        services.AddScoped<GetMovieRequiredAgeUseCase>();
        services.AddScoped<GetMoviesUseCase>();
        services.AddScoped<GetMovieDetailUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Booking.Showtimes.GetSimilarMoviesUseCase>();
        services.AddScoped<GetScheduleDatesUseCase>();
        services.AddScoped<GetScheduleDetailsUseCase>();
        services.AddScoped<GetAuditoriumDetailsUseCase>();
        services.AddScoped<GetAllUpcomingDatesUseCase>();

        services.AddHttpClient();
        
        return services;
    }
}
