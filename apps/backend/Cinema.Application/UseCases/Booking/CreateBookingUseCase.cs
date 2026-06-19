using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.Interfaces;
using Cinema.Application.UseCases.PricingPromotions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Enums;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Localization;
using Cinema.Domain.Utils;

namespace Cinema.Application.UseCases.Booking;

public class CreateBookingUseCase
{
    private readonly IBookingRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly IVnPayService _vnPayService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CreateBookingUseCase> _logger;
    private readonly CalculatePricingPromotionUseCase _calculatePricingPromotionUseCase;

    public CreateBookingUseCase(
        IBookingRepository repository,
        IUserContextService userContextService,
        IVnPayService vnPayService,
        IConfiguration configuration,
        ILogger<CreateBookingUseCase> logger,
        CalculatePricingPromotionUseCase calculatePricingPromotionUseCase)
    {
        _repository = repository;
        _userContextService = userContextService;
        _vnPayService = vnPayService;
        _configuration = configuration;
        _logger = logger;
        _calculatePricingPromotionUseCase = calculatePricingPromotionUseCase;
    }

    public async Task<BaseResponse<ResCreateBookingDto>> ExecuteAsync(ReqCreateBookingDto request, string ipAddress)
    {
        await using var transaction = await _repository.BeginTransactionAsync();
        try
        {
            var userId = _userContextService.TryGetUserId();
            var isCashier = _userContextService.IsInRole("Cashier");

            Guid? orderUserId = null;
            Guid? orderStaffId = null;

            if (isCashier)
            {
                orderStaffId = request.StaffId;
                
                // Fallback: Tìm kiếm nhân viên đang có ca làm hoạt động tại rạp của quầy này
                if (!orderStaffId.HasValue && userId.HasValue)
                {
                    var dept = await _repository.GetDepartmentBySharedUserIdAsync(userId.Value);
                    if (dept != null)
                    {
                        var activeLog = await _repository.GetActiveStaffLoggerAsync(dept.CinemaId);
                        if (activeLog != null)
                        {
                            orderStaffId = activeLog.StaffId;
                        }
                    }
                }

                if (!string.IsNullOrEmpty(request.CustomerEmail))
                {
                    var customer = await _repository.FindUserByEmailAsync(request.CustomerEmail);
                    if (customer != null)
                    {
                        orderUserId = customer.UserId;
                    }
                }
            }
            else
            {
                orderUserId = userId;
            }

            // Validate schedule
            var schedule = await _repository.GetScheduleByIdAsync(request.ScheduleId);
            if (schedule == null || schedule.MovieInfoEntity == null || !schedule.MovieInfoEntity.IsActive)
            {
                throw new BadRequestException(Messages.Booking.ScheduleNotFoundOrInactive, "BK01");
            }

            if (schedule.StartTime <= DateTime.UtcNow)
            {
                throw new BadRequestException(Messages.Booking.ShowtimeAlreadyStarted, "BK02");
            }

            var seatIds = request.SeatSelections.Select(s => s.SeatId).ToList();
            var segmentIds = request.SeatSelections.Select(s => s.UserSegmentId).Distinct().ToList();

            // Validate seats belong to the auditorium
            var validSeats = await _repository.GetValidSeatsAsync(schedule.AuditoriumId, seatIds);
            if (validSeats.Count != seatIds.Count)
            {
                throw new BadRequestException(Messages.Booking.InvalidSeats, "BK03");
            }

            // Validate all segment IDs exist
            var validSegments = await _repository.GetSegmentsAsync(true);
            var validSegmentIds = new HashSet<Guid>(validSegments.Select(seg => seg.UserSegmentId));
            if (!segmentIds.All(id => validSegmentIds.Contains(id)))
            {
                throw new BadRequestException("Loại khách hàng không hợp lệ.", "BK06");
            }

            // Check seats aren't already booked
            var alreadyBooked = await _repository.GetAlreadyBookedSeatsAsync(request.ScheduleId, seatIds);
            if (alreadyBooked.Any())
            {
                throw new BadRequestException(Messages.Booking.SeatsAlreadyBooked, "BK04");
            }

            // Calculate price per seat based on segment surcharge
            var basePrice = schedule.MovieFormatInfoEntity?.MovieFormatPrice ?? 0;
            var cinemaId = schedule.AuditoriumInfoEntities?.CinemaId;
            var formatId = schedule.MovieFormatId;

            var surcharges = await _repository.GetCinemaSurchargesAsync(cinemaId ?? Guid.Empty, formatId);

            decimal totalPrice = 0;
            var orderDetails = new List<OrderDetailsInfo>();
            var orderId = Guid.NewGuid();

            foreach (var sel in request.SeatSelections)
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
                    MovieScheduleId = request.ScheduleId,
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

            // Calculate segment-based discount
            decimal roleDiscountPercent = 0;
            if (orderUserId.HasValue)
            {
                var customerProfile = await _repository.GetCustomerProfileAsync(orderUserId.Value);
                if (customerProfile != null && customerProfile.UserSegmentsInfoEntity != null)
                {
                    var segmentName = customerProfile.UserSegmentsInfoEntity.UserSegmentName;
                    if (segmentName == "VIP Member")
                    {
                        roleDiscountPercent = 15;
                    }
                    else if (segmentName == "Student")
                    {
                        roleDiscountPercent = 10;
                    }
                    else
                    {
                        roleDiscountPercent = 5; // Standard Member or others get 5%
                    }
                }
                else
                {
                    roleDiscountPercent = 5; // Default discount for registered users
                }
            }

            // Calculate voucher discount
            decimal voucherDiscountPercent = 0;
            if (request.VoucherId.HasValue)
            {
                if (!orderUserId.HasValue)
                {
                    throw new BadRequestException("Guests cannot apply vouchers.", "BK07");
                }

                var userVoucher = await _repository.GetUserVoucherAsync(request.VoucherId.Value, orderUserId.Value);
                if (userVoucher == null)
                {
                    throw new BadRequestException("Voucher is invalid or has already been used.", "BK08");
                }

                if (!userVoucher.VoucherInfoEntity.IsValid(null))
                {
                    throw new BadRequestException("Voucher has expired or is not active yet.", "BK09");
                }

                voucherDiscountPercent = userVoucher.VoucherInfoEntity.voucherDiscountPercent;
            }

            decimal totalDiscountPercent = roleDiscountPercent + voucherDiscountPercent;
            if (totalDiscountPercent > 100)
            {
                totalDiscountPercent = 100;
            }

            decimal finalPrice = totalPrice * (1 - (totalDiscountPercent / 100));
            finalPrice = Math.Round(finalPrice, 0);
            var voucherDiscountAmount = totalPrice - finalPrice;

            foreach (var detail in orderDetails)
            {
                var detailDiscount = Math.Round(detail.PriceBeforeVoucher * (totalDiscountPercent / 100), 0);
                detail.VoucherDiscountAmount = detailDiscount;
                detail.FinalPrice = Math.Max(0, detail.PriceBeforeVoucher - detailDiscount);
            }

            string? finalCustomerName = null;
            string? finalCustomerEmail = null;

            if (orderUserId.HasValue)
            {
                var user = await _repository.FindUserByIdAsync(orderUserId.Value);
                finalCustomerName = user?.UserName;
                finalCustomerEmail = user?.UserEmail;
            }
            else
            {
                if (string.IsNullOrEmpty(request.CustomerName) || string.IsNullOrEmpty(request.CustomerEmail))
                {
                    throw new BadRequestException("Guest booking requires Customer Name and Email.", "BK05");
                }
                finalCustomerName = request.CustomerName;
                finalCustomerEmail = request.CustomerEmail;
            }

            var order = new OrderInfoEntity
            {
                OrderId = orderId,
                UserId = orderUserId,
                StaffId = orderStaffId,
                OrderStatus = OrderStatusEnum.Pending,
                PaymentMethod = PaymentMethodEnum.VNPAY,
                TotalPrice = finalPrice,
                SubtotalPrice = totalPrice,
                PromotionDiscountAmount = orderDetails.Sum(x => x.PricingAdjustmentAmount < 0 ? Math.Abs(x.PricingAdjustmentAmount) : 0),
                VoucherDiscountAmount = voucherDiscountAmount,
                FinalAmount = finalPrice,
                PricingSnapshotJson = System.Text.Json.JsonSerializer.Serialize(orderDetails.Select(x => new
                {
                    x.SeatId,
                    x.UserSegmentId,
                    x.BaseFormatPriceSnapshot,
                    x.PricingAdjustmentAmount,
                    x.PriceBeforeVoucher,
                    x.VoucherDiscountAmount,
                    x.FinalPrice
                })),
                OrderDate = DateTime.UtcNow,
                TotalQuantity = seatIds.Count,
                CustomerName = finalCustomerName,
                CustomerEmail = finalCustomerEmail,
                CustomerAddress = orderUserId.HasValue ? null : request.CustomerAddress,
                VoucherId = request.VoucherId
            };

            await _repository.AddOrderAsync(order);
            await _repository.AddOrderDetailsRangeAsync(orderDetails);
            await _repository.SaveChangesAsync();
            await transaction.CommitAsync();

            var paymentUrl = _vnPayService.GenerateVnpayUrl((long)finalPrice, orderId.ToString(), ipAddress);

            return new BaseResponse<ResCreateBookingDto>
            {
                IsSuccess = true,
                Data = new ResCreateBookingDto
                {
                    OrderId = orderId,
                    PaymentUrl = paymentUrl,
                    TotalPrice = finalPrice,
                    TotalQuantity = seatIds.Count,
                    OrderDate = order.OrderDate
                },
                Message = Messages.Booking.CreateBookingSuccess
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            if (ex is AppException) throw;
            _logger.LogError(ex, "Error creating booking");
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
}
