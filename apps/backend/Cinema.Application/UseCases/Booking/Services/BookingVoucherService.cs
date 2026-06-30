using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Localization;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Application.UseCases.Booking.Services;

public class BookingVoucherService
{
    private readonly IBookingOrderRepository _orderRepository;

    public BookingVoucherService(IBookingOrderRepository orderRepository)
    {
        _orderRepository = orderRepository;
    }

    public async Task<decimal> ValidateAndCalculateVoucherDiscountAsync(
        ReqCreateBookingDto request,
        Guid? orderUserId)
    {
        if (!request.VoucherId.HasValue)
            return 0;

        if (!orderUserId.HasValue)
            throw new BadRequestException(Messages.Voucher.GuestsCannotApply, "BK07");

        var userVoucher = await _orderRepository.GetUserVoucherAsync(request.VoucherId.Value, orderUserId.Value);
        if (userVoucher == null)
            throw new BadRequestException(Messages.Voucher.InvalidOrUsed, "BK08");

        if (!userVoucher.VoucherInfoEntity.IsValid(null))
            throw new BadRequestException(Messages.Voucher.ExpiredOrInactive, "BK09");

        return userVoucher.VoucherInfoEntity.voucherDiscountPercent;
    }

    public static decimal ApplyDiscounts(decimal totalPrice, decimal roleDiscountPercent, decimal voucherDiscountPercent,
        List<OrderDetailsInfo> orderDetails)
    {
        decimal totalDiscountPercent = Math.Min(roleDiscountPercent + voucherDiscountPercent, 100);
        decimal finalPrice = Math.Round(totalPrice * (1 - (totalDiscountPercent / 100)), 0);

        foreach (var detail in orderDetails)
        {
            var detailDiscount = Math.Round(detail.PriceBeforeVoucher * (totalDiscountPercent / 100), 0);
            detail.VoucherDiscountAmount = detailDiscount;
            detail.FinalPrice = Math.Max(0, detail.PriceBeforeVoucher - detailDiscount);
        }

        return finalPrice;
    }
}
