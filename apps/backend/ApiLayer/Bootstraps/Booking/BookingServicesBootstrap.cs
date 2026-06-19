using BusinessLayer.Services.Booking;
using BusinessLayer.Services.PricingPromotions;
using BusinessLayer.Services.Vouchers;
using Shared.Utils;

namespace ApiLayer.Bootstraps.Booking;

public static class BookingServicesBootstrap
{
    public static IServiceCollection AddBookingServices(this IServiceCollection services)
    {
        services.AddScoped<BookingService>();
        services.AddScoped<VoucherService>();
        services.AddScoped<PricingPromotionService>();
        services.AddSingleton<SseConnectionManager>();
        services.AddSingleton<VnPayHelper>();
        return services;
    }
}
