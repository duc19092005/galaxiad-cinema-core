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
using Cinema.Application.UseCases.Booking.SocialBooking;

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
    private readonly IGroupBookingCacheService _groupBookingCacheService;
    private readonly IVoteTimeoutScheduler _voteTimeoutScheduler;

    public ProcessVnPayCallbackUseCase(
        IPaymentCallbackRepository repo,
        IVnPayService vnPayService,
        ILogger<ProcessVnPayCallbackUseCase> logger,
        IUnitOfWork unitOfWork,
        IMovieCacheService cacheService,
        IGroupBookingRepository groupBookingRepo,
        ISeatLockerNotificationService notificationService,
        SocialBooking.GetGroupBookingStateUseCase getGroupStateUseCase,
        IGroupBookingCacheService groupBookingCacheService,
        IVoteTimeoutScheduler voteTimeoutScheduler)
    {
        _unitOfWork = unitOfWork;
        _repo = repo;
        _vnPayService = vnPayService;
        _logger = logger;
        _cacheService = cacheService;
        _groupBookingRepo = groupBookingRepo;
        _notificationService = notificationService;
        _getGroupStateUseCase = getGroupStateUseCase;
        _groupBookingCacheService = groupBookingCacheService;
        _voteTimeoutScheduler = voteTimeoutScheduler;
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

        if (txnRef.StartsWith("GROUPMEM-"))
        {
            var memberResult = await ProcessIndividualGroupPaymentCallback(txnRef, responseCode, transactionId);
            return (memberResult.success, memberResult.orderId, memberResult.groupCode);
        }

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

        if (session.Status != GroupBookingStatusEnum.Paying &&
            session.Status != GroupBookingStatusEnum.PayingAll)
        {
            _logger.LogWarning("Group session {SessionId} is not in group payment status, current: {Status}",
                session.GroupSessionId, session.Status);
            return (false, Guid.Empty, null);
        }

        var isSuccess = _vnPayService.IsPaymentSuccess(responseCode);
        Guid firstOrderId = Guid.Empty;

        if (isSuccess)
        {
            var activeMembers = session.Members
                .Where(m => m.Status != GroupMemberStatusEnum.Removed)
                .ToList();

            foreach (var member in activeMembers)
            {
                var order = await CreateBookedOrderForMemberAsync(member, session.MovieScheduleId, transactionId);
                await _repo.AddOrderAsync(order);
                if (firstOrderId == Guid.Empty)
                    firstOrderId = order.OrderId;

                member.Status = GroupMemberStatusEnum.Paid;
                member.AmountPaid = member.AmountToPay;
                member.PaidAt = DateTime.UtcNow;
                member.VnPayTransactionId = transactionId;
                _groupBookingRepo.UpdateMember(member);
            }

            session.TotalGroupAmount = activeMembers.Sum(m => m.AmountToPay);
            session.CollectedAmount = session.TotalGroupAmount;
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

            foreach (var member in session.Members.Where(m =>
                m.Status == GroupMemberStatusEnum.Confirmed ||
                m.Status == GroupMemberStatusEnum.Paired))
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

        if (isSuccess)
        {
            await _groupBookingCacheService.ClearAllGroupDataAsync(session.GroupSessionId);
            _voteTimeoutScheduler.Cancel(session.GroupSessionId);
        }

        // Broadcast updated state to all connected SignalR clients
        var updatedState = await _getGroupStateUseCase.ExecuteAsync(session.GroupSessionId);
        if (updatedState.IsSuccess && updatedState.Data != null)
        {
            await _notificationService.NotifyGroupUpdateAsync(session.GroupSessionId, updatedState.Data);
        }

        return (isSuccess, firstOrderId, session.GroupCode);
    }

    private async Task<(bool success, Guid orderId, string? groupCode)> ProcessIndividualGroupPaymentCallback(
        string txnRef,
        string responseCode,
        string transactionId)
    {
        // Hỗ trợ cả format cũ (GROUPMEM-{memberId:N}) và mới (GROUPMEM-{memberId:N}-{ticks})
        var memberIdPart = txnRef["GROUPMEM-".Length..];
        var memberIdText = memberIdPart.Contains('-')
            ? memberIdPart[..memberIdPart.LastIndexOf('-')]
            : memberIdPart;
        if (!Guid.TryParseExact(memberIdText, "N", out var memberId))
        {
            _logger.LogWarning("Invalid group member ID in VNPay callback: {TxnRef}", txnRef);
            return (false, Guid.Empty, null);
        }

        var loadedMember = await _groupBookingRepo.GetMemberByIdAsync(memberId);
        if (loadedMember == null)
        {
            _logger.LogWarning("Group member not found for VNPay callback: {TxnRef}", txnRef);
            return (false, Guid.Empty, null);
        }

        var session = await _groupBookingRepo.GetSessionWithMembersAsync(loadedMember.GroupSessionId);
        if (session == null)
        {
            _logger.LogWarning("Group session not found for member payment callback: {MemberId}", memberId);
            return (false, Guid.Empty, null);
        }

        if (session.Status != GroupBookingStatusEnum.PayingIndividual &&
            session.Status != GroupBookingStatusEnum.PaymentFailedPartial)
        {
            _logger.LogWarning("Group session {SessionId} is not in individual payment status, current: {Status}",
                session.GroupSessionId, session.Status);
            return (false, Guid.Empty, session.GroupCode);
        }

        var member = session.Members.FirstOrDefault(m => m.MemberId == memberId);
        if (member == null || member.Status == GroupMemberStatusEnum.Removed)
        {
            _logger.LogWarning("Active group member not found for VNPay callback: {MemberId}", memberId);
            return (false, Guid.Empty, session.GroupCode);
        }

        if (member.Status == GroupMemberStatusEnum.Paid)
        {
            return (true, Guid.Empty, session.GroupCode);
        }

        var isSuccess = _vnPayService.IsPaymentSuccess(responseCode);
        Guid orderId = Guid.Empty;

        if (isSuccess)
        {
            var order = await CreateBookedOrderForMemberAsync(member, session.MovieScheduleId, transactionId);
            await _repo.AddOrderAsync(order);
            orderId = order.OrderId;

            member.Status = GroupMemberStatusEnum.Paid;
            member.AmountPaid = member.AmountToPay;
            member.PaidAt = DateTime.UtcNow;
            member.VnPayTransactionId = transactionId;
            _groupBookingRepo.UpdateMember(member);

            await _notificationService.NotifyGroupChatMessageAsync(session.GroupSessionId, new ResGroupChatMessageDto
            {
                MessageId = Guid.NewGuid(),
                SenderName = "System",
                Content = $"{member.UserInfoEntity?.UserName ?? "Thành viên"} đã thanh toán thành công phần của mình.",
                MessageType = GroupChatMessageTypeEnum.PaymentEvent,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            member.Status = GroupMemberStatusEnum.PaymentFailed;
            _groupBookingRepo.UpdateMember(member);

            await _notificationService.NotifyGroupChatMessageAsync(session.GroupSessionId, new ResGroupChatMessageDto
            {
                MessageId = Guid.NewGuid(),
                SenderName = "System",
                Content = $"{member.UserInfoEntity?.UserName ?? "Thành viên"} thanh toán thất bại.",
                MessageType = GroupChatMessageTypeEnum.PaymentEvent,
                CreatedAt = DateTime.UtcNow
            });
        }

        var activeMembers = session.Members
            .Where(m => m.Status != GroupMemberStatusEnum.Removed)
            .ToList();
        session.CollectedAmount = activeMembers.Sum(m => m.AmountPaid);
        session.TotalGroupAmount = activeMembers.Sum(m => m.AmountToPay);

        // Check if there are any members still pending payment
        var hasPendingPayment = activeMembers.Any(m => 
            m.Status == GroupMemberStatusEnum.Confirmed || 
            m.Status == GroupMemberStatusEnum.Paired);

        if (!hasPendingPayment)
        {
            var failedMembers = activeMembers.Where(m => m.Status == GroupMemberStatusEnum.PaymentFailed).ToList();
            if (failedMembers.Any())
            {
                session.Status = GroupBookingStatusEnum.PaymentFailedPartial;
                session.PaymentDeadlineAt = DateTime.UtcNow.AddSeconds(60);

                var resolutionState = new ResPaymentFailureVoteStateDto
                {
                    Phase = "Selection",
                    ExpiresAt = session.PaymentDeadlineAt,
                    FailedMembers = failedMembers.Select(fm => new FailedMemberVolunteersDto
                    {
                        FailedMemberId = fm.MemberId,
                        FailedMemberName = fm.UserInfoEntity?.UserName ?? "Unknown",
                        FailedAmount = fm.AmountToPay,
                        Volunteers = new List<VolunteerDto>()
                    }).ToList(),
                    OptionVotes = new List<GroupFailureOptionVoteDto>(),
                    ResolutionAction = null
                };

                var ttl = GroupBookingCacheTtl.ForGroup(session.ExpiresAt);
                await _groupBookingCacheService.SetFailureResolutionStateAsync(session.GroupSessionId, resolutionState, ttl);

                await _notificationService.NotifyGroupChatMessageAsync(session.GroupSessionId, new ResGroupChatMessageDto
                {
                    MessageId = Guid.NewGuid(),
                    SenderName = "System",
                    Content = $"Tất cả thành viên đã hoàn tất thanh toán. Có {failedMembers.Count} thành viên thất bại. Bắt đầu đếm ngược 60 giây để đăng ký trả hộ.",
                    MessageType = GroupChatMessageTypeEnum.PaymentEvent,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                session.Status = GroupBookingStatusEnum.Completed;
            }
        }
        else
        {
            // Maintain current payment status
        }

        _groupBookingRepo.UpdateSession(session);

        await _unitOfWork.SaveChangesAsync();

        if (isSuccess)
        {
            try
            {
                await _cacheService.ClearUserCacheAsync(member.UserId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to clear user cache on Redis");
            }
        }

        if (session.Status == GroupBookingStatusEnum.Completed)
        {
            _notificationService.ClearGroupSelections(
                session.MovieScheduleId.ToString(),
                session.GroupSessionId);
            await _groupBookingCacheService.ClearAllGroupDataAsync(session.GroupSessionId);
            _voteTimeoutScheduler.Cancel(session.GroupSessionId);
        }

        var updatedState = await _getGroupStateUseCase.ExecuteAsync(session.GroupSessionId);
        if (updatedState.IsSuccess && updatedState.Data != null)
        {
            await _notificationService.NotifyGroupUpdateAsync(session.GroupSessionId, updatedState.Data);
        }

        return (isSuccess, orderId, session.GroupCode);
    }

    private async Task<OrderInfoEntity> CreateBookedOrderForMemberAsync(
        GroupBookingMemberEntity member,
        Guid movieScheduleId,
        string transactionId)
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
                MovieScheduleId = movieScheduleId,
                UserSegmentId = userSegmentId,
                PriceEach = seat.PriceEach,
                BaseFormatPriceSnapshot = seat.PriceEach,
                PricingAdjustmentAmount = 0,
                PriceBeforeVoucher = seat.PriceEach,
                VoucherDiscountAmount = 0,
                FinalPrice = seat.PriceEach
            });
        }

        return order;
    }
}
