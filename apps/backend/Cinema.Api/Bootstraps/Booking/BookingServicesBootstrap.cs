using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces.Vouchers;
using Cinema.Application.Interfaces.PricingPromotions;
using Cinema.Infrastructure.ExternalServices.Notifications;
using Cinema.Application.UseCases.Booking.BookingFlow;
using Cinema.Application.UseCases.Booking.Showtimes;
using Cinema.Application.UseCases.Booking.UserHistory;
using Cinema.Application.UseCases.Booking.Services;
using Cinema.Application.UseCases.Booking.SocialBooking;
using Cinema.Application.UseCases.Admin.PricingPromotions;
using Cinema.Application.UseCases.Admin.Vouchers;
using Cinema.Infrastructure.Persistence.Repositories.Booking;
using Cinema.Infrastructure.Persistence.Repositories.Common;
using Cinema.Infrastructure.Persistence.Repositories.Vouchers;
using Cinema.Infrastructure.Persistence.Repositories.PricingPromotions;
using Cinema.Domain.Utils;

namespace Cinema.Api.Bootstraps.Booking;

public static class BookingServicesBootstrap
{
    public static IServiceCollection AddBookingServices(this IServiceCollection services)
    {
        // Core Booking infrastructure
        services.AddScoped<ICommonBookingQueries, CommonBookingQueries>();
        services.AddScoped<IBookingCatalogRepository, BookingCatalogRepository>();
        services.AddScoped<IBookingShowtimeRepository, BookingShowtimeRepository>();
        services.AddScoped<ISeatMapRepository, SeatMapRepository>();
        services.AddScoped<IBookingPricingRepository, BookingPricingRepository>();
        services.AddScoped<IBookingOrderRepository, BookingOrderRepository>();
        services.AddScoped<IUserBookingRepository, UserBookingRepository>();
        services.AddScoped<IPaymentCallbackRepository, PaymentCallbackRepository>();
        services.AddScoped<IVoucherRepository, VoucherRepository>();
        services.AddScoped<IPricingPromotionRepository, PricingPromotionRepository>();
        services.AddSingleton<SeatLockManager>();
        services.AddSingleton<GroupBookingWsManager>();

        // SignalR broadcasters (implementations of Application-layer interfaces)
        services.AddSingleton<Cinema.Api.Hubs.SignalRSeatBroadcaster>();
        services.AddSingleton<Cinema.Api.Hubs.SignalRGroupBroadcaster>();
        services.AddSingleton<Cinema.Application.Interfaces.Booking.ISeatBroadcaster>(sp => sp.GetRequiredService<Cinema.Api.Hubs.SignalRSeatBroadcaster>());
        services.AddSingleton<Cinema.Application.Interfaces.Booking.IGroupBroadcaster>(sp => sp.GetRequiredService<Cinema.Api.Hubs.SignalRGroupBroadcaster>());
        services.AddSingleton<VnPayHelper>();

        // Social Booking
        services.AddScoped<IGroupBookingRepository, GroupBookingRepository>();
        services.AddScoped<CreateGroupBookingUseCase>();
        services.AddScoped<JoinGroupBookingUseCase>();
        services.AddScoped<GetGroupBookingStateUseCase>();
        services.AddScoped<SelectGroupSeatsUseCase>();
        services.AddScoped<RenewGroupMemberSeatLocksUseCase>();
        services.AddScoped<ConfirmGroupMemberSeatsUseCase>();
        services.AddScoped<PayGroupBookingUseCase>();
        services.AddScoped<SendGroupChatMessageUseCase>();
        services.AddScoped<GetGroupChatMessagesUseCase>();
        services.AddScoped<VoteMovieUseCase>();
        services.AddScoped<HandleGroupPaymentFailureUseCase>();
        services.AddScoped<LeaveGroupBookingUseCase>();
        services.AddScoped<VotePaymentMethodUseCase>();
        services.AddScoped<GetPaymentMethodVoteStateUseCase>();
        services.AddScoped<CreatePairUseCase>();
        services.AddScoped<RespondPairUseCase>();
        services.AddScoped<GetGroupPairsUseCase>();
        services.AddScoped<VotePaymentFailureUseCase>();
        services.AddScoped<RaiseHandUseCase>();

        // Booking Use Cases
        services.AddScoped<GetNowShowingMoviesUseCase>();
        services.AddScoped<GetComingSoonMoviesUseCase>();
        services.AddScoped<GetMovieDetailUseCase>();
        services.AddScoped<GetSimilarMoviesUseCase>();
        services.AddScoped<GetActiveCinemasUseCase>();
        services.AddScoped<GetNearestCinemasUseCase>();
        services.AddScoped<GetActiveMoviesUseCase>();
        services.AddScoped<GetAdvancedSearchSchedulesUseCase>();
        services.AddScoped<GetCitiesUseCase>();
        services.AddScoped<GetGenresUseCase>();
        services.AddScoped<GetCinemaShowtimesUseCase>();
        services.AddScoped<GetSeatMapUseCase>();
        services.AddScoped<GetPricingUseCase>();
        services.AddScoped<BookingPricingService>();
        services.AddScoped<BookingVoucherService>();
        services.AddScoped<CreateBookingUseCase>();
        services.AddScoped<GetTicketDataUseCase>();
        services.AddScoped<ProcessVnPayCallbackUseCase>();
        services.AddScoped<GetUserAccountInfoUseCase>();
        services.AddScoped<GetUserBookingHistoryUseCase>();
        services.AddScoped<GetBookingCustomerByEmailUseCase>();

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
        services.AddScoped<CheckPricingPromotionConflictsUseCase>();

        return services;
    }
}
