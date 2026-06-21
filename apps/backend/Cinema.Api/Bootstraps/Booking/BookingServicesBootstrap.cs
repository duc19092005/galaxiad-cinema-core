using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces.Vouchers;
using Cinema.Application.Interfaces.PricingPromotions;
using Cinema.Application.Infrastructure.Booking;
using Cinema.Application.UseCases.Booking;
using Cinema.Application.UseCases.PricingPromotions;
using Cinema.Application.UseCases.Vouchers;
using Cinema.Infrastructure.Repositories;
using Cinema.Domain.Utils;

namespace Cinema.Api.Bootstraps.Booking;

public static class BookingServicesBootstrap
{
    public static IServiceCollection AddBookingServices(this IServiceCollection services)
    {
        // Core Booking infrastructure
        services.AddScoped<IBookingCatalogRepository, BookingCatalogRepository>();
        services.AddScoped<IBookingShowtimeRepository, BookingShowtimeRepository>();
        services.AddScoped<ISeatMapRepository, SeatMapRepository>();
        services.AddScoped<IBookingPricingRepository, BookingPricingRepository>();
        services.AddScoped<IBookingOrderRepository, BookingOrderRepository>();
        services.AddScoped<IUserBookingRepository, UserBookingRepository>();
        services.AddScoped<IPaymentCallbackRepository, PaymentCallbackRepository>();
        services.AddScoped<IVoucherRepository, VoucherRepository>();
        services.AddScoped<IPricingPromotionRepository, PricingPromotionRepository>();
        services.AddSingleton<SseConnectionManager>();
        services.AddSingleton<VnPayHelper>();

        // Booking Use Cases
        services.AddScoped<GetNowShowingMoviesUseCase>();
        services.AddScoped<GetComingSoonMoviesUseCase>();
        services.AddScoped<GetMovieDetailUseCase>();
        services.AddScoped<GetActiveCinemasUseCase>();
        services.AddScoped<GetNearestCinemasUseCase>();
        services.AddScoped<GetActiveMoviesUseCase>();
        services.AddScoped<GetAdvancedSearchSchedulesUseCase>();
        services.AddScoped<GetCitiesUseCase>();
        services.AddScoped<GetGenresUseCase>();
        services.AddScoped<GetCinemaShowtimesUseCase>();
        services.AddScoped<GetSeatMapUseCase>();
        services.AddScoped<GetPricingUseCase>();
        services.AddScoped<CreateBookingUseCase>();
        services.AddScoped<GetTicketDataUseCase>();
        services.AddScoped<ProcessVnPayCallbackUseCase>();
        services.AddScoped<GetUserAccountInfoUseCase>();
        services.AddScoped<GetUserBookingHistoryUseCase>();

        // Vouchers Use Cases
        services.AddScoped<CreateVoucherUseCase>();
        services.AddScoped<UpdateVoucherUseCase>();
        services.AddScoped<DeleteVoucherUseCase>();
        services.AddScoped<GetVoucherByIdUseCase>();
        services.AddScoped<GetAllVouchersUseCase>();
        services.AddScoped<GetActiveVouchersUseCase>();
        services.AddScoped<RedeemVoucherUseCase>();
        services.AddScoped<GetMyVouchersUseCase>();

        // Pricing Promotions Use Cases
        services.AddScoped<CreatePricingPromotionUseCase>();
        services.AddScoped<UpdatePricingPromotionUseCase>();
        services.AddScoped<DeletePricingPromotionUseCase>();
        services.AddScoped<GetPricingPromotionByIdUseCase>();
        services.AddScoped<GetAllPricingPromotionsUseCase>();
        services.AddScoped<GetActivePublicPricingPromotionsUseCase>();
        services.AddScoped<GetPricingPromotionBySlugUseCase>();
        services.AddScoped<TogglePricingPromotionUseCase>();
        services.AddScoped<CalculatePricingPromotionUseCase>();
        services.AddScoped<GetPricingPromotionOptionsUseCase>();

        return services;
    }
}
