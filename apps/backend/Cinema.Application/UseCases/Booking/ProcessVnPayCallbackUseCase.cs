using Cinema.Application.Interfaces.Booking;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Enums;
using Cinema.Domain.Utils;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;
using Cinema.Application.Dtos.Booking;
using Cinema.Domain.Entities.GroupBooking;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Application.UseCases.Booking;

public class ProcessVnPayCallbackUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPaymentCallbackRepository _repo;
    private readonly IVnPayService _vnPayService;
    private readonly ILogger<ProcessVnPayCallbackUseCase> _logger;
    private readonly IMovieCacheService _cacheService;
    private readonly IGroupBookingRepository _groupBookingRepo;
    private readonly ISeatLockerNotificationService _notificationService;
    private readonly SocialBooking.GetGroupBookingStateUseCase _getGroupStateUseCase;

    public ProcessVnPayCallbackUseCase(
        IPaymentCallbackRepository repo,
        IVnPayService vnPayService,
        ILogger<ProcessVnPayCallbackUseCase> logger,
        IUnitOfWork unitOfWork,
        IMovieCacheService cacheService,
        IGroupBookingRepository groupBookingRepo,
        ISeatLockerNotificationService notificationService,
        SocialBooking.GetGroupBookingStateUseCase getGroupStateUseCase)
    {
        _unitOfWork = unitOfWork;
        _repo = repo;
        _vnPayService = vnPayService;
        _logger = logger;
        _cacheService = cacheService;
        _groupBookingRepo = groupBookingRepo;
        _notificationService = notificationService;
        _getGroupStateUseCase = getGroupStateUseCase;
    }

    public async Task<(bool success, Guid orderId, string? groupCode)> ExecuteAsync(IDictionary<string, string> vnpParams)
    {
        // Validate signature
        if (!_vnPayService.ValidateCallback(vnpParams))
        {
            _logger.LogWarning("Invalid VNPay callback signature");
            return (false, Guid.Empty, null);
        }

        vnpParams.TryGetValue("vnp_TxnRef", out var txnRef);
        vnpParams.TryGetValue("vnp_ResponseCode", out var responseCode);
        vnpParams.TryGetValue("vnp_TransactionNo", out var transactionId);
        txnRef ??= "";
        responseCode ??= "";
        transactionId ??= "";

        // Handle GROUP booking payments
        if (txnRef.StartsWith("GROUP-"))
        {
            var groupResult = await ProcessGroupPaymentCallback(txnRef, responseCode, transactionId);
            return (groupResult.success, groupResult.orderId, groupResult.groupCode);
        }

        // Regular order payment
        if (!Guid.TryParse(txnRef, out var orderId))
        {
            _logger.LogWarning("Invalid order ID in VNPay callback: {OrderId}", txnRef);
            return (false, Guid.Empty, null);
        }

        var order = await _repo.GetOrderByIdAsync(orderId);

        if (order == null)
        {
            _logger.LogWarning("Order not found for VNPay callback: {OrderId}", orderId);
            return (false, orderId, null);
        }

        if (order.OrderStatus != OrderStatusEnum.Pending)
        {
            _logger.LogWarning("Order {OrderId} is not in Pending status, current: {Status}",
                orderId, order.OrderStatus);
            return (false, orderId, null);
        }

        var isSuccess = _vnPayService.IsPaymentSuccess(responseCode);

        if (isSuccess)
        {
            order.OrderStatus = OrderStatusEnum.Booked;
            order.VnPayTransactionId = transactionId;

            // Credit points and mark voucher as used
            if (order.UserId.HasValue)
            {
                var customerProfile = await _repo.GetCustomerProfileWithSegmentAsync(order.UserId.Value);

                decimal earningMultiplier = 1m;
                if (customerProfile?.UserSegmentsInfoEntity != null)
                {
                    var segmentName = customerProfile.UserSegmentsInfoEntity.UserSegmentName;
                    if (segmentName == "VIP Member")
                        earningMultiplier = 2m;
                    else if (segmentName == "Student")
                        earningMultiplier = 1.5m;
                }

                var ticketCount = await _repo.CountOrderDetailsAsync(order.OrderId);
                var pointsFromPrice = (long)Math.Floor(order.TotalPrice / 10000m);
                var pointsFromTickets = ticketCount * 10L;
                var pointsEarned = Math.Max(1L, (long)Math.Floor((pointsFromPrice + pointsFromTickets) * earningMultiplier));

                if (pointsEarned > 0)
                {
                    var user = await _repo.FindUserByIdAsync(order.UserId.Value);
                    if (user != null)
                    {
                        user.RewardPoints += pointsEarned;
                    }
                }

                if (order.VoucherId.HasValue)
                {
                    var userVoucher = await _repo.GetUserVoucherForUsageAsync(order.VoucherId.Value, order.UserId.Value);
                    if (userVoucher != null)
                    {
                        userVoucher.IsUsed = true;
                        userVoucher.UsedAt = DateTime.UtcNow;
                    }
                }
            }
        }
        else
        {
            order.OrderStatus = OrderStatusEnum.Canceled;
        }

        await _unitOfWork.SaveChangesAsync();

        if (order.UserId.HasValue)
        {
            try
            {
                await _cacheService.ClearUserCacheAsync(order.UserId.Value);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to clear user cache on Redis");
            }
        }

        return (isSuccess, orderId, null);
    }

    private async Task<(bool success, Guid orderId, string? groupCode)> ProcessGroupPaymentCallback(string txnRef, string responseCode, string transactionId)
    {
        var partialId = txnRef["GROUP-".Length..];
        var session = await _groupBookingRepo.FindSessionByPartialIdAsync(partialId);

        if (session == null)
        {
            _logger.LogWarning("Group session not found for VNPay callback: {TxnRef}", txnRef);
            return (false, Guid.Empty, null);
        }

        if (session.Status != GroupBookingStatusEnum.Paying)
        {
            _logger.LogWarning("Group session {SessionId} is not in Paying status, current: {Status}",
                session.GroupSessionId, session.Status);
            return (false, Guid.Empty, null);
        }

        var isSuccess = _vnPayService.IsPaymentSuccess(responseCode);

        if (isSuccess)
        {
            var activeMembers = session.Members
                .Where(m => m.Status != GroupMemberStatusEnum.Removed)
                .ToList();

            foreach (var member in activeMembers)
            {
                var userSegmentId = Guid.Parse("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7");
                var customerProfile = await _repo.GetCustomerProfileWithSegmentAsync(member.UserId);
                if (customerProfile?.UserSegmentsInfoEntity != null)
                {
                    userSegmentId = customerProfile.UserSegmentsInfoEntity.UserSegmentId;
                }

                var order = new OrderInfoEntity
                {
                    OrderId = Guid.NewGuid(),
                    BookingCode = "GXD-" + Guid.NewGuid().ToString("N")[..8].ToUpper(),
                    UserId = member.UserId,
                    OrderStatus = OrderStatusEnum.Booked,
                    PaymentMethod = PaymentMethodEnum.VNPAY,
                    TotalPrice = member.AmountToPay,
                    SubtotalPrice = member.AmountToPay,
                    FinalAmount = member.AmountToPay,
                    OrderDate = DateTime.UtcNow,
                    TotalQuantity = member.SelectedSeats?.Count ?? 0,
                    VnPayTransactionId = transactionId
                };

                var seats = member.SelectedSeats?.ToList() ?? [];
                foreach (var seat in seats)
                {
                    order.OrderDetailsInfo.Add(new OrderDetailsInfo
                    {
                        OrderId = order.OrderId,
                        SeatId = seat.SeatId,
                        MovieScheduleId = session.MovieScheduleId,
                        UserSegmentId = userSegmentId,
                        PriceEach = seat.PriceEach,
                        BaseFormatPriceSnapshot = seat.PriceEach,
                        PricingAdjustmentAmount = 0,
                        PriceBeforeVoucher = seat.PriceEach,
                        VoucherDiscountAmount = 0,
                        FinalPrice = seat.PriceEach
                    });
                }

                await _repo.AddOrderAsync(order);

                member.Status = GroupMemberStatusEnum.Paid;
                member.PaidAt = DateTime.UtcNow;
                member.VnPayTransactionId = transactionId;
                _groupBookingRepo.UpdateMember(member);
            }

            session.Status = GroupBookingStatusEnum.Completed;
            _groupBookingRepo.UpdateSession(session);

            await _notificationService.NotifyGroupChatMessageAsync(session.GroupSessionId, new ResGroupChatMessageDto
            {
                MessageId = Guid.NewGuid(),
                SenderName = "System",
                Content = "Thanh toán thành công! Tất cả thành viên đã có vé. Chúc các bạn xem phim vui vẻ!",
                MessageType = GroupChatMessageTypeEnum.PaymentEvent,
                CreatedAt = DateTime.UtcNow
            });

            var seatIds = activeMembers
                .SelectMany(m => m.SelectedSeats ?? [])
                .Select(s => s.SeatId)
                .ToList();
            if (seatIds.Count > 0)
            {
                _notificationService.ClearGroupSelections(
                    session.MovieScheduleId.ToString(),
                    session.GroupSessionId);
            }
        }
        else
        {
            session.Status = GroupBookingStatusEnum.PaymentFailed;

            foreach (var member in session.Members.Where(m => m.Status == GroupMemberStatusEnum.Confirmed))
            {
                member.Status = GroupMemberStatusEnum.PaymentFailed;
                _groupBookingRepo.UpdateMember(member);
            }

            _groupBookingRepo.UpdateSession(session);

            await _notificationService.NotifyGroupChatMessageAsync(session.GroupSessionId, new ResGroupChatMessageDto
            {
                MessageId = Guid.NewGuid(),
                SenderName = "System",
                Content = "Thanh toán thất bại. Chủ phòng vui lòng xử lý.",
                MessageType = GroupChatMessageTypeEnum.PaymentEvent,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _unitOfWork.SaveChangesAsync();

        // Broadcast updated state to all connected WebSocket clients
        var updatedState = await _getGroupStateUseCase.ExecuteAsync(session.GroupSessionId);
        if (updatedState.IsSuccess && updatedState.Data != null)
        {
            await _notificationService.NotifyGroupUpdateAsync(session.GroupSessionId, updatedState.Data);
        }

        return (isSuccess, session.GroupSessionId, session.GroupCode);
    }
}

