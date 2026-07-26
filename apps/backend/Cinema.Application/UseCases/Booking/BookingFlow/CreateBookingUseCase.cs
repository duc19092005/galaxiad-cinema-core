using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces.Concessions;
using Cinema.Application.Dtos.Concessions;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.UseCases.Booking.Services;
using Cinema.Domain.Enums;
using Cinema.Domain.Constants;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;
using Cinema.Domain.Utils;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Entities.MovieInfos;

namespace Cinema.Application.UseCases.Booking.BookingFlow;

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
    private readonly ISeatLockService _seatLockService;
    private readonly ISeatLockerNotificationService _seatLockerNotificationService;
    private readonly IInventoryStockService _inventoryStockService;
    private readonly IConcessionRepository _concessionRepository;

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
        IBackgroundJobScheduler jobScheduler,
        ISeatLockService seatLockService,
        ISeatLockerNotificationService seatLockerNotificationService,
        IInventoryStockService inventoryStockService,
        IConcessionRepository concessionRepository)
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
        _seatLockService = seatLockService;
        _seatLockerNotificationService = seatLockerNotificationService;
        _inventoryStockService = inventoryStockService;
        _concessionRepository = concessionRepository;
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
            ValidateAgeRestrictions(schedule, request);
            var customerProfile = await GetCustomerProfileAsync(orderUserId);

            var orderId = Guid.NewGuid();
            var (orderDetails, totalPrice) = await _pricingService.CalculateSeatPricesAsync(
                schedule, request.SeatSelections, orderId, customerProfile?.MembershipRank);

            var roleDiscountPercent = BookingPricingService.CalculateRoleDiscountPercent(customerProfile);
            var voucherDiscountPercent = await _voucherService.ValidateAndCalculateVoucherDiscountAsync(request, orderUserId);
            var ticketFinalPrice = BookingVoucherService.ApplyDiscounts(totalPrice, roleDiscountPercent, voucherDiscountPercent, orderDetails);

            var concessionItems = (request.ConcessionItems ?? [])
                .Where(item => item.Quantity > 0)
                .GroupBy(item => item.ProductId)
                .Select(group => new ReqConcessionItemDto
                {
                    ProductId = group.Key,
                    Quantity = group.Sum(item => item.Quantity)
                })
                .ToList();

            var cinemaId = schedule.AuditoriumInfoEntities?.CinemaId ?? Guid.Empty;
            var concessionProducts = concessionItems.Count == 0
                ? []
                : await _concessionRepository.GetProductsByIdsWithInventoryAsync(concessionItems.Select(item => item.ProductId));

            if (concessionProducts.Count != concessionItems.Count
                || concessionProducts.Any(product => product.CinemaId != cinemaId || !product.IsActive || !product.IsAvailableOnline))
            {
                throw new BadRequestException("One or more concession products are unavailable for this cinema.", "BK14");
            }

            var concessionSubtotal = concessionItems.Sum(item =>
                concessionProducts.First(product => product.ProductId == item.ProductId).UnitPrice * item.Quantity);
            var finalPrice = ticketFinalPrice + concessionSubtotal;

            var (finalName, finalEmail, finalPhone) = await ResolveCustomerInfoAsync(
                orderUserId, isCashier, customerName, customerEmail, customerPhone);

            var resolvedPaymentMethod = request.PaymentMethod ?? PaymentMethodEnum.VNPAY;
            var resolvedOrderStatus = isCashier && resolvedPaymentMethod == PaymentMethodEnum.CASH
                ? OrderStatusEnum.Booked
                : OrderStatusEnum.Pending;

            var order = BuildOrderEntity(orderId, orderUserId, orderStaffId, resolvedOrderStatus,
                resolvedPaymentMethod, finalPrice, totalPrice, concessionSubtotal, orderDetails,
                finalName, finalEmail, finalPhone, request, seatIds: request.SeatSelections.Select(s => s.SeatId).ToList());

            await _orderRepository.AddOrderAsync(order);
            await _orderRepository.AddOrderDetailsRangeAsync(orderDetails);

            if (concessionItems.Count > 0)
            {
                var performedByUserId = orderStaffId ?? orderUserId;
                if (resolvedOrderStatus == OrderStatusEnum.Booked)
                    await _inventoryStockService.SellDirectAsync(cinemaId, concessionItems, orderId, performedByUserId);
                else
                    await _inventoryStockService.ReserveAsync(cinemaId, concessionItems, orderId, performedByUserId);
            }

            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            await ClearUserCacheAsync(orderUserId);
            SchedulePostCommitJobs(orderId, resolvedOrderStatus, orderUserId);
            await NotifySeatsUnavailableAsync(request);

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
            if (IsSeatUniqueConflict(ex))
            {
                _logger.LogWarning(ex, "Seat conflict while creating booking for schedule {ScheduleId}", request.ScheduleId);
                throw new BadRequestException(Messages.Booking.SeatsAlreadyBooked, "BK04");
            }

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

        var auditoriumSeats = await _orderRepository.GetAuditoriumSeatsAsync(schedule.AuditoriumId);
        
        // In-memory validation of seat existence in the auditorium
        var validSeatCount = auditoriumSeats.Count(s => seatIds.Contains(s.SeatId));
        if (validSeatCount != seatIds.Count)
            throw new BadRequestException(Messages.Booking.InvalidSeats, "BK03");

        var alreadyBooked = await _orderRepository.GetAlreadyBookedSeatsAsync(request.ScheduleId, seatIds);
        if (alreadyBooked.Any())
            throw new BadRequestException(Messages.Booking.SeatsAlreadyBooked, "BK04");

        var occupiedSeatIds = await _orderRepository.GetOccupiedSeatIdsAsync(request.ScheduleId);
        var seatSelectionErrors = BookingSeatSelectionPolicy.ValidateSeatSelection(auditoriumSeats, seatIds, occupiedSeatIds);
        if (seatSelectionErrors.Count > 0)
            throw new BadRequestException(seatSelectionErrors, "BK10");

        await ValidateRedisSeatLocksAsync(request.ScheduleId, seatIds, request.SeatLockOwnerToken);
    }

    private static void ValidateAgeRestrictions(MovieScheduleInfoEntity schedule, ReqCreateBookingDto request)
    {
        var ageSymbol = schedule.MovieInfoEntity?.MovieRequiredAgeEntity?.MovieRequiredAgeSymbol?.Trim();
        if (string.IsNullOrEmpty(ageSymbol) || ageSymbol == "P" || ageSymbol == "K")
            return;

        var restrictedSegmentIds = new List<Guid>();
        // T13, T16, T18: Block Child only (Student/Senior allowed)
        if (ageSymbol is "T13" or "T16" or "T18")
            restrictedSegmentIds.Add(user_segments_constant.Child);

        if (restrictedSegmentIds.Count == 0)
            return;

        var violations = request.SeatSelections
            .Where(s => restrictedSegmentIds.Contains(s.UserSegmentId))
            .ToList();

        if (violations.Count > 0)
            throw new BadRequestException(Messages.Booking.AgeRestrictionViolation, "BK13");
    }

    private async Task ValidateRedisSeatLocksAsync(Guid scheduleId, List<Guid> seatIds, string? ownerToken)
    {
        var locks = await _seatLockService.GetLocksForScheduleAsync(scheduleId.ToString());
        var locksBySeat = locks.ToDictionary(l => l.SeatId.ToLowerInvariant(), l => l);

        foreach (var seatId in seatIds)
        {
            var key = seatId.ToString().ToLowerInvariant();
            if (!locksBySeat.TryGetValue(key, out var lockInfo))
                continue;

            if (string.IsNullOrWhiteSpace(ownerToken) || lockInfo.OwnerToken != ownerToken)
                throw new BadRequestException("One or more seats are currently locked by another user", "BK11");
        }

        if (!string.IsNullOrWhiteSpace(ownerToken))
        {
            var ownedSeats = locks
                .Where(l => l.OwnerToken == ownerToken)
                .Select(l => Guid.Parse(l.SeatId))
                .ToHashSet();

            if (!seatIds.All(ownedSeats.Contains))
                throw new BadRequestException("One or more selected seats are no longer held by your session", "BK12");
        }
    }

    private async Task<CustomerProfileEntity?> GetCustomerProfileAsync(Guid? userId)
    {
        return userId.HasValue
            ? await _orderRepository.GetCustomerProfileAsync(userId.Value)
            : null;
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
        PaymentMethodEnum paymentMethod, decimal finalPrice, decimal subtotal, decimal concessionSubtotal,
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
            SubtotalPrice = subtotal + concessionSubtotal,
            ConcessionSubtotal = concessionSubtotal,
            PromotionDiscountAmount = details.Sum(x => x.PricingAdjustmentAmount < 0 ? Math.Abs(x.PricingAdjustmentAmount) : 0),
            VoucherDiscountAmount = Math.Max(0, subtotal + concessionSubtotal - finalPrice),
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
                job => job.ExecuteForOrderAsync(orderId), TimeSpan.FromMinutes(15));
        }
    }

    private async Task NotifySeatsUnavailableAsync(ReqCreateBookingDto request)
    {
        var seatIds = request.SeatSelections.Select(s => s.SeatId.ToString()).ToList();
        if (seatIds.Count == 0) return;

        try
        {
            await _seatLockerNotificationService.NotifySeatsUnavailableAsync(
                request.ScheduleId.ToString(),
                seatIds,
                request.SeatLockOwnerToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to notify unavailable seats after booking creation");
        }
    }

    private static bool IsSeatUniqueConflict(Exception exception)
    {
        if (!exception.GetType().Name.Contains("DbUpdateException", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var message = exception.ToString();
        return message.Contains("IX_OrderDetailsInfoEntity_MovieScheduleId_SeatId", StringComparison.OrdinalIgnoreCase)
               || (message.Contains("OrderDetailsInfoEntity", StringComparison.OrdinalIgnoreCase)
                   && message.Contains("duplicate", StringComparison.OrdinalIgnoreCase));
    }
}
