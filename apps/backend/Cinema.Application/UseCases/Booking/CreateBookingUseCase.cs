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
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;
using Cinema.Domain.Utils;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Booking;

public class CreateBookingUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IBookingOrderRepository _orderRepository;
    private readonly IBookingPricingRepository _pricingRepository;
    private readonly IUserContextService _userContextService;
    private readonly IVnPayService _vnPayService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CreateBookingUseCase> _logger;
    private readonly CalculatePricingPromotionUseCase _calculatePricingPromotionUseCase;
    private readonly IMovieCacheService _cacheService;
    private readonly IBackgroundJobScheduler _jobScheduler;

    public CreateBookingUseCase(
        IBookingOrderRepository orderRepository,
        IBookingPricingRepository pricingRepository,
        IUserContextService userContextService,
        IVnPayService vnPayService,
        IConfiguration configuration,
        ILogger<CreateBookingUseCase> logger,
        CalculatePricingPromotionUseCase calculatePricingPromotionUseCase,
        IUnitOfWork unitOfWork,
        IMovieCacheService cacheService,
        IBackgroundJobScheduler jobScheduler)
    {
        _unitOfWork = unitOfWork;
        _orderRepository = orderRepository;
        _pricingRepository = pricingRepository;
        _userContextService = userContextService;
        _vnPayService = vnPayService;
        _configuration = configuration;
        _logger = logger;
        _calculatePricingPromotionUseCase = calculatePricingPromotionUseCase;
        _cacheService = cacheService;
        _jobScheduler = jobScheduler;
    }

    public async Task<BaseResponse<ResCreateBookingDto>> ExecuteAsync(ReqCreateBookingDto request, string ipAddress)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var userId = _userContextService.TryGetUserId();
            var isCashier = _userContextService.IsInRole("Cashier");
            var customerEmail = request.CustomerEmail?.Trim();
            var customerName = request.CustomerName?.Trim();
            var customerPhone = request.CustomerPhone?.Trim();

            Guid? orderUserId = null;
            Guid? orderStaffId = null;

            if (isCashier)
            {
                orderStaffId = request.StaffId;
                
                // Fallback: Tìm kiếm nhân viên đang có ca làm hoạt động tại rạp của quầy này
                if (!orderStaffId.HasValue && userId.HasValue)
                {
                    var dept = await _orderRepository.GetDepartmentBySharedUserIdAsync(userId.Value);
                    if (dept != null)
                    {
                        var activeLog = await _orderRepository.GetActiveStaffLoggerAsync(dept.CinemaId);
                        if (activeLog != null)
                        {
                            orderStaffId = activeLog.StaffId;
                        }
                    }
                }

                if (!string.IsNullOrEmpty(customerEmail))
                {
                    var customer = await _orderRepository.FindUserByEmailAsync(customerEmail);
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
            var schedule = await _orderRepository.GetScheduleByIdAsync(request.ScheduleId);
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
            var validSeats = await _orderRepository.GetValidSeatsAsync(schedule.AuditoriumId, seatIds);
            if (validSeats.Count != seatIds.Count)
            {
                throw new BadRequestException(Messages.Booking.InvalidSeats, "BK03");
            }

            // Validate all segment IDs exist
            var validSegments = await _pricingRepository.GetSegmentsAsync(true);
            var validSegmentIds = new HashSet<Guid>(validSegments.Select(seg => seg.UserSegmentId));
            if (!segmentIds.All(id => validSegmentIds.Contains(id)))
            {
                throw new BadRequestException(Messages.Validation.InvalidCustomerType, "BK06");
            }

            // Check seats aren't already booked
            var alreadyBooked = await _orderRepository.GetAlreadyBookedSeatsAsync(request.ScheduleId, seatIds);
            if (alreadyBooked.Any())
            {
                throw new BadRequestException(Messages.Booking.SeatsAlreadyBooked, "BK04");
            }

            var auditoriumSeats = await _orderRepository.GetAuditoriumSeatsAsync(schedule.AuditoriumId);
            var occupiedSeatIds = await _orderRepository.GetOccupiedSeatIdsAsync(request.ScheduleId);
            var seatSelectionErrors = BookingSeatSelectionPolicy.ValidateSeatSelection(
                auditoriumSeats,
                seatIds,
                occupiedSeatIds);

            if (seatSelectionErrors.Count > 0)
            {
                throw new BadRequestException(seatSelectionErrors, "BK10");
            }

            // Calculate price per seat based on segment surcharge
            var basePrice = schedule.MovieFormatInfoEntity?.MovieFormatPrice ?? 0;
            var cinemaId = schedule.AuditoriumInfoEntities?.CinemaId;
            var formatId = schedule.MovieFormatId;

            var surcharges = await _pricingRepository.GetCinemaSurchargesAsync(cinemaId ?? Guid.Empty, formatId);

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
                var customerProfile = await _orderRepository.GetCustomerProfileAsync(orderUserId.Value);
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
                    throw new BadRequestException(Messages.Voucher.GuestsCannotApply, "BK07");
                }

                var userVoucher = await _orderRepository.GetUserVoucherAsync(request.VoucherId.Value, orderUserId.Value);
                if (userVoucher == null)
                {
                    throw new BadRequestException(Messages.Voucher.InvalidOrUsed, "BK08");
                }

                if (!userVoucher.VoucherInfoEntity.IsValid(null))
                {
                    throw new BadRequestException(Messages.Voucher.ExpiredOrInactive, "BK09");
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
            string? finalCustomerPhone = null;

            if (orderUserId.HasValue)
            {
                var user = await _orderRepository.FindUserByIdAsync(orderUserId.Value);
                finalCustomerName = user?.UserName;
                finalCustomerEmail = user?.UserEmail;
                finalCustomerPhone = user?.PhoneNumber;
            }
            else
            {
                var cashierGuestMissingInfo = isCashier && (string.IsNullOrEmpty(customerName) || string.IsNullOrEmpty(customerPhone));
                var publicGuestMissingInfo = !isCashier && (string.IsNullOrEmpty(customerName) || string.IsNullOrEmpty(customerEmail));
                if (cashierGuestMissingInfo || publicGuestMissingInfo)
                {
                    throw new BadRequestException(Messages.Validation.GuestBookingRequiresInfo, "BK05");
                }
                finalCustomerName = customerName;
                finalCustomerEmail = customerEmail;
                finalCustomerPhone = customerPhone;
            }

            var order = new OrderInfoEntity
            {
                OrderId     = orderId,
                BookingCode = "GXD-" + Guid.NewGuid().ToString("N")[..8].ToUpper(),
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
                CustomerPhone = finalCustomerPhone,
                CustomerAddress = orderUserId.HasValue ? null : request.CustomerAddress,
                VoucherId = request.VoucherId
            };

            await _orderRepository.AddOrderAsync(order);
            await _orderRepository.AddOrderDetailsRangeAsync(orderDetails);
            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            _jobScheduler.Schedule<IPendingOrderCancellationJob>(
                job => job.ExecuteForOrderAsync(orderId),
                TimeSpan.FromMinutes(10)
            );

            if (orderUserId.HasValue)
            {
                try
                {
                    await _cacheService.ClearUserCacheAsync(orderUserId.Value);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to clear user cache on Redis");
                }
            }

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
