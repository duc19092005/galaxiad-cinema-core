using BusinessLayer.Services.Booking;
using Shared.Utils;

namespace ApiLayer.Bootstraps.Booking;

public static class BookingServicesBootstrap
{
    public static IServiceCollection AddBookingServices(this IServiceCollection services)
    {
        services.AddScoped<BookingService>();
        services.AddSingleton<SseConnectionManager>();
        services.AddSingleton<VnPayHelper>();
        return services;
    }
}
