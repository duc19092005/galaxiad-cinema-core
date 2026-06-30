using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces.PricingPromotions;
using Cinema.Application.UseCases.Admin.PricingPromotions;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Application.UseCases.Booking.Services;

public class BookingPricingService
{
    private readonly IBookingPricingRepository _pricingRepository;
    private readonly CalculatePricingPromotionUseCase _calculatePricingPromotionUseCase;

    public BookingPricingService(
        IBookingPricingRepository pricingRepository,
        CalculatePricingPromotionUseCase calculatePricingPromotionUseCase)
    {
        _pricingRepository = pricingRepository;
        _calculatePricingPromotionUseCase = calculatePricingPromotionUseCase;
    }

    public async Task<(List<OrderDetailsInfo> Details, decimal TotalPrice)> CalculateSeatPricesAsync(
        MovieScheduleInfoEntity schedule,
        List<SeatSelectionDto> seatSelections,
        Guid orderId)
    {
        var basePrice = schedule.MovieFormatInfoEntity?.MovieFormatPrice ?? 0;
        var cinemaId = schedule.AuditoriumInfoEntities?.CinemaId;
        var formatId = schedule.MovieFormatId;

        var surcharges = await _pricingRepository.GetCinemaSurchargesAsync(cinemaId ?? Guid.Empty, formatId);

        decimal totalPrice = 0;
        var orderDetails = new List<OrderDetailsInfo>();

        foreach (var sel in seatSelections)
        {
            var surcharge = surcharges.FirstOrDefault(s => s.UserSegmentId == sel.UserSegmentId);
            var priceBeforePromotion = basePrice;
            if (surcharge != null)
            {
                priceBeforePromotion = basePrice * (1 + (surcharge.SurchangePercent / 100));
            }
            priceBeforePromotion = Math.Round(priceBeforePromotion, 0);
            var promotionPrice = await _calculatePricingPromotionUseCase.ExecuteAsync(
                schedule,
                priceBeforePromotion,
                sel.UserSegmentId);
            var priceEach = Math.Round(promotionPrice.FinalPrice, 0);
            totalPrice += priceEach;

            orderDetails.Add(new OrderDetailsInfo
            {
                OrderId = orderId,
                SeatId = sel.SeatId,
                MovieScheduleId = schedule.MovieScheduleInfoId,
                UserSegmentId = sel.UserSegmentId,
                PriceEach = priceEach,
                BaseFormatPriceSnapshot = basePrice,
                PricingAdjustmentAmount = promotionPrice.TotalAdjustmentAmount,
                AppliedPromotionSnapshotJson = promotionPrice.SnapshotJson,
                PriceBeforeVoucher = priceEach,
                VoucherDiscountAmount = 0,
                FinalPrice = priceEach
            });
        }

        return (orderDetails, totalPrice);
    }

    public static decimal CalculateRoleDiscountPercent(CustomerProfileEntity? customerProfile)
    {
        if (customerProfile?.UserSegmentsInfoEntity == null)
            return 5;

        var segmentName = customerProfile.UserSegmentsInfoEntity.UserSegmentName;
        return segmentName switch
        {
            "VIP Member" => 15,
            "Student" => 10,
            _ => 5
        };
    }
}
