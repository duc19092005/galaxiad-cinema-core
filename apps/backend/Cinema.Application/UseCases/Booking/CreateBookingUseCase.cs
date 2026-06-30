using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.UseCases.Booking.Services;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;
using Cinema.Domain.Utils;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Entities.MovieInfos;

namespace Cinema.Application.UseCases.Booking;

public class CreateBookingUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IBookingOrderRepository _orderRepository;
    private readonly IUserContextService _userContextService;
    private readonly IVnPayService _vnPayService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CreateBookingUseCase> _logger;
    private readonly BookingPricingService _pricingService;
    private readonly BookingVoucherService _voucherService;
    private readonly IMovieCacheService _cacheService;
    private readonly IBackgroundJobScheduler _jobScheduler;

    public CreateBookingUseCase(
        IBookingOrderRepository orderRepository,
        IUserContextService userContextService,
        IVnPayService vnPayService,
        IConfiguration configuration,
        ILogger<CreateBookingUseCase> logger,
        BookingPricingService pricingService,
        BookingVoucherService voucherService,
        IUnitOfWork unitOfWork,
        IMovieCacheService cacheService,
        IBackgroundJobScheduler jobScheduler)
    {
        _unitOfWork = unitOfWork;
        _orderRepository = orderRepository;
        _userContextService = userContextService;
        _vnPayService = vnPayService;
        _configuration = configuration;
        _logger = logger;
        _pricingService = pricingService;
        _voucherService = voucherService;
        _cacheService = cacheService;
        _jobScheduler = jobScheduler;
    }

    public async Task<BaseResponse<ResCreateBookingDto>> ExecuteAsync(ReqCreateBookingDto request, string ipAddress)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var (orderUserId, orderStaffId, isCashier, customerEmail, customerName, customerPhone) =
                await ResolveUserIdentityAsync(request);

            var schedule = await ValidateScheduleAsync(request.ScheduleId);
            await ValidateSeatsAsync(schedule, request);

            var orderId = Guid.NewGuid();
            var (orderDetails, totalPrice) = await _pricingService.CalculateSeatPricesAsync(
                schedule, request.SeatSelections, orderId);

            var roleDiscountPercent = await GetRoleDiscountAsync(orderUserId);
            var voucherDiscountPercent = await _voucherService.ValidateAndCalculateVoucherDiscountAsync(request, orderUserId);
            var finalPrice = BookingVoucherService.ApplyDiscounts(totalPrice, roleDiscountPercent, voucherDiscountPercent, orderDetails);

            var (finalName, finalEmail, finalPhone) = await ResolveCustomerInfoAsync(
                orderUserId, isCashier, customerName, customerEmail, customerPhone);

            var resolvedPaymentMethod = request.PaymentMethod ?? PaymentMethodEnum.VNPAY;
            var resolvedOrderStatus = isCashier && resolvedPaymentMethod == PaymentMethodEnum.CASH
                ? OrderStatusEnum.Booked
                : OrderStatusEnum.Pending;

            var order = BuildOrderEntity(orderId, orderUserId, orderStaffId, resolvedOrderStatus,
                resolvedPaymentMethod, finalPrice, totalPrice, orderDetails,
                finalName, finalEmail, finalPhone, request, seatIds: request.SeatSelections.Select(s => s.SeatId).ToList());

            await _orderRepository.AddOrderAsync(order);
            await _orderRepository.AddOrderDetailsRangeAsync(orderDetails);
            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            await ClearUserCacheAsync(orderUserId);
            SchedulePostCommitJobs(orderId, resolvedOrderStatus, orderUserId);

            var paymentUrl = resolvedOrderStatus == OrderStatusEnum.Pending
                ? _vnPayService.GenerateVnpayUrl((long)finalPrice, orderId.ToString(), ipAddress)
                : string.Empty;

            return new BaseResponse<ResCreateBookingDto>
            {
                IsSuccess = true,
                Data = new ResCreateBookingDto
                {
                    OrderId = orderId,
                    PaymentUrl = paymentUrl,
                    TotalPrice = finalPrice,
                    TotalQuantity = request.SeatSelections.Count,
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

    private async Task<(Guid? UserId, Guid? StaffId, bool IsCashier, string? Email, string? Name, string? Phone)> ResolveUserIdentityAsync(ReqCreateBookingDto request)
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
            if (!orderStaffId.HasValue && userId.HasValue)
            {
                var dept = await _orderRepository.GetDepartmentBySharedUserIdAsync(userId.Value);
                if (dept != null)
                {
                    var activeLog = await _orderRepository.GetActiveStaffLoggerAsync(dept.CinemaId);
                    if (activeLog != null) orderStaffId = activeLog.StaffId;
                }
            }
            if (!string.IsNullOrEmpty(customerEmail))
            {
                var customer = await _orderRepository.FindUserByEmailAsync(customerEmail);
                if (customer != null) orderUserId = customer.UserId;
            }
        }
        else
        {
            orderUserId = userId;
        }

        return (orderUserId, orderStaffId, isCashier, customerEmail, customerName, customerPhone);
    }

    private async Task<MovieScheduleInfoEntity> ValidateScheduleAsync(Guid scheduleId)
    {
        var schedule = await _orderRepository.GetScheduleByIdAsync(scheduleId);
        if (schedule == null || schedule.MovieInfoEntity == null || !schedule.MovieInfoEntity.IsActive)
            throw new BadRequestException(Messages.Booking.ScheduleNotFoundOrInactive, "BK01");

        if (schedule.StartTime <= DateTime.UtcNow)
            throw new BadRequestException(Messages.Booking.ShowtimeAlreadyStarted, "BK02");

        return schedule;
    }

    private async Task ValidateSeatsAsync(MovieScheduleInfoEntity schedule, ReqCreateBookingDto request)
    {
        var seatIds = request.SeatSelections.Select(s => s.SeatId).ToList();
        var segmentIds = request.SeatSelections.Select(s => s.UserSegmentId).Distinct().ToList();

        var validSeats = await _orderRepository.GetValidSeatsAsync(schedule.AuditoriumId, seatIds);
        if (validSeats.Count != seatIds.Count)
            throw new BadRequestException(Messages.Booking.InvalidSeats, "BK03");

        var alreadyBooked = await _orderRepository.GetAlreadyBookedSeatsAsync(request.ScheduleId, seatIds);
        if (alreadyBooked.Any())
            throw new BadRequestException(Messages.Booking.SeatsAlreadyBooked, "BK04");

        var auditoriumSeats = await _orderRepository.GetAuditoriumSeatsAsync(schedule.AuditoriumId);
        var occupiedSeatIds = await _orderRepository.GetOccupiedSeatIdsAsync(request.ScheduleId);
        var seatSelectionErrors = BookingSeatSelectionPolicy.ValidateSeatSelection(auditoriumSeats, seatIds, occupiedSeatIds);
        if (seatSelectionErrors.Count > 0)
            throw new BadRequestException(seatSelectionErrors, "BK10");
    }

    private async Task<decimal> GetRoleDiscountAsync(Guid? userId)
    {
        if (!userId.HasValue) return 0;
        var customerProfile = await _orderRepository.GetCustomerProfileAsync(userId.Value);
        return BookingPricingService.CalculateRoleDiscountPercent(customerProfile);
    }

    private async Task<(string? Name, string? Email, string? Phone)> ResolveCustomerInfoAsync(
        Guid? userId, bool isCashier, string? name, string? email, string? phone)
    {
        if (userId.HasValue)
        {
            var user = await _orderRepository.FindUserByIdAsync(userId.Value);
            return (user?.UserName, user?.UserEmail, user?.PhoneNumber);
        }

        var cashierMissing = isCashier && (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(phone));
        var publicMissing = !isCashier && (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(email));
        if (cashierMissing || publicMissing)
            throw new BadRequestException(Messages.Validation.GuestBookingRequiresInfo, "BK05");

        return (name, email, phone);
    }

    private OrderInfoEntity BuildOrderEntity(
        Guid orderId, Guid? userId, Guid? staffId, OrderStatusEnum status,
        PaymentMethodEnum paymentMethod, decimal finalPrice, decimal subtotal,
        List<OrderDetailsInfo> details, string? name, string? email, string? phone,
        ReqCreateBookingDto request, List<Guid> seatIds)
    {
        return new OrderInfoEntity
        {
            OrderId = orderId,
            BookingCode = "GXD-" + Guid.NewGuid().ToString("N")[..8].ToUpper(),
            UserId = userId,
            StaffId = staffId,
            OrderStatus = status,
            PaymentMethod = paymentMethod,
            TotalPrice = finalPrice,
            SubtotalPrice = subtotal,
            PromotionDiscountAmount = details.Sum(x => x.PricingAdjustmentAmount < 0 ? Math.Abs(x.PricingAdjustmentAmount) : 0),
            VoucherDiscountAmount = subtotal - finalPrice,
            FinalAmount = finalPrice,
            PricingSnapshotJson = System.Text.Json.JsonSerializer.Serialize(details.Select(x => new
            {
                x.SeatId, x.UserSegmentId, x.BaseFormatPriceSnapshot,
                x.PricingAdjustmentAmount, x.PriceBeforeVoucher, x.VoucherDiscountAmount, x.FinalPrice
            })),
            OrderDate = DateTime.UtcNow,
            TotalQuantity = seatIds.Count,
            CustomerName = name,
            CustomerEmail = email,
            CustomerPhone = phone,
            CustomerAddress = userId.HasValue ? null : request.CustomerAddress,
            VoucherId = request.VoucherId
        };
    }

    private async Task ClearUserCacheAsync(Guid? userId)
    {
        if (!userId.HasValue) return;
        try { await _cacheService.ClearUserCacheAsync(userId.Value); }
        catch (Exception ex) { _logger.LogWarning(ex, "Failed to clear user cache on Redis"); }
    }

    private void SchedulePostCommitJobs(Guid orderId, OrderStatusEnum status, Guid? userId)
    {
        if (status == OrderStatusEnum.Pending)
        {
            _jobScheduler.Schedule<IPendingOrderCancellationJob>(
                job => job.ExecuteForOrderAsync(orderId), TimeSpan.FromMinutes(10));
        }
    }
}
