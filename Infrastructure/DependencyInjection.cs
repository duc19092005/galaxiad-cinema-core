using Application.Booking.Ports;
using Application.Booking.UseCases;
using Application.Common;
using Application.Identity.Ports;
using Application.Identity.UseCases;
using Application.MovieManager.Ports;
using Application.MovieManager.UseCases;
using Application.TheaterManager.Ports;
using Application.TheaterManager.UseCases;
using Infrastructure.Booking;
using Infrastructure.Common;
using Infrastructure.Identity;
using Infrastructure.MovieManager;
using Infrastructure.TheaterManager;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure;

/// <summary>
/// Đăng ký DI cho tầng Application + Infrastructure (Clean Architecture).
/// Gọi từ composition root (ApiLayer/Program.cs).
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddCleanArchitecture(this IServiceCollection services)
    {
        // Common ports
        services.AddSingleton<IClock, SystemClock>();
        services.AddScoped<IUnitOfWork, EfUnitOfWork>();

        // Booking module — adapters
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IBookingQueryRepository, BookingQueryRepository>();
        services.AddScoped<IExpiredOrderQuery, ExpiredOrderQuery>();
        services.AddScoped<IPaymentGateway, VnPayGatewayAdapter>();

        // Booking module — use cases
        services.AddScoped<CreateBookingUseCase>();
        services.AddScoped<ProcessVnPayCallbackUseCase>();
        services.AddScoped<CancelExpiredPendingOrdersUseCase>();

        // Booking module — background jobs
        services.AddHostedService<ExpiredOrderCleanupService>();

        // Identity module — adapters
        services.AddScoped<IUserAccountRepository, UserAccountRepository>();
        services.AddScoped<IUserProfileRepository, UserProfileRepository>();
        services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<IIdentityProtector, Aes256IdentityProtector>();

        // Identity module — use cases
        services.AddScoped<LoginRegularUseCase>();
        services.AddScoped<RegisterRegularUseCase>();
        services.AddScoped<UserProfileUseCase>();

        // MovieManager module — adapters
        services.AddScoped<IMovieRepository, MovieRepository>();
        services.AddScoped<IImageStorage, CloudinaryImageStorage>();
        services.AddScoped<IBackgroundJobScheduler, HangfireJobScheduler>();
        services.AddScoped<MovieStatusJob>();
        services.AddScoped<ScheduleStatusJob>();

        // MovieManager module — use cases
        services.AddScoped<WriteMovieUseCase>();

        // TheaterManager module — adapters + use cases
        services.AddScoped<ISchedulingRepository, SchedulingRepository>();
        services.AddScoped<WriteScheduleUseCase>();

        return services;
    }
}
