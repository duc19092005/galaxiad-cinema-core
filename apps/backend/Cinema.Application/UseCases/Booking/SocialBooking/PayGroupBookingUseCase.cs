using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class PayGroupBookingUseCase
{
    private readonly IGroupBookingRepository _groupBookingRepository;
    private readonly IUserContextService _userContextService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IVnPayService _vnPayService;
    private readonly IConfiguration _configuration;
    private readonly ISeatLockerNotificationService _notificationService;
    private readonly GetGroupBookingStateUseCase _getGroupBookingStateUseCase;
    private readonly IGroupBookingCacheService _cache;

    public PayGroupBookingUseCase(
        IGroupBookingRepository groupBookingRepository,
        IUserContextService userContextService,
        IUnitOfWork unitOfWork,
        IVnPayService vnPayService,
        IConfiguration configuration,
        ISeatLockerNotificationService notificationService,
        GetGroupBookingStateUseCase getGroupBookingStateUseCase,
        IGroupBookingCacheService cache)
    {
        _groupBookingRepository = groupBookingRepository;
        _userContextService = userContextService;
        _unitOfWork = unitOfWork;
        _vnPayService = vnPayService;
        _configuration = configuration;
        _notificationService = notificationService;
        _getGroupBookingStateUseCase = getGroupBookingStateUseCase;
        _cache = cache;
    }

    public async Task<BaseResponse<ResPayGroupBookingDto>> ExecuteAsync(Guid groupSessionId, string ipAddress, Guid? failedMemberId = null)
    {
        var userId = _userContextService.GetUserId();

        var session = await _groupBookingRepository.GetSessionWithMembersAsync(groupSessionId);
        if (session == null)
            throw new NotFoundException("Group booking session not found");

        var member = session.Members.FirstOrDefault(m => m.UserId == userId && m.Status != GroupMemberStatusEnum.Removed);
        if (member == null)
            throw new BadRequestException("You are not a member of this group", "GBK41");

        // Trả hộ cho thành viên thanh toán thất bại
        if (failedMemberId.HasValue)
        {
            if (session.Status != GroupBookingStatusEnum.PaymentFailedPartial)
                throw new BadRequestException("Group is not in payment failure resolution state", "GBK46");

            var targetMember = session.Members.FirstOrDefault(m => m.MemberId == failedMemberId.Value && m.Status != GroupMemberStatusEnum.Removed);
            if (targetMember == null || targetMember.Status != GroupMemberStatusEnum.PaymentFailed)
                throw new BadRequestException("Target member has not failed payment", "GBK47");

            var resolutionState = await _cache.GetFailureResolutionStateAsync(groupSessionId)
                ?? throw new BadRequestException("No active failure resolution state found", "GBK48");

            var targetVolunteers = resolutionState.FailedMembers.FirstOrDefault(fm => fm.FailedMemberId == failedMemberId.Value);
            if (targetVolunteers == null || !targetVolunteers.Volunteers.Any(v => v.UserId == userId))
                throw new BadRequestException("You are not registered as a volunteer for this member", "GBK49");

            // Tạo link thanh toán VNPay cho thành viên thất bại đó
            return await CreateIndividualPaymentAsync(session, targetMember, ipAddress);
        }

        var activeMembers = session.Members.Where(m => m.Status != GroupMemberStatusEnum.Removed).ToList();
        var allConfirmed = activeMembers.All(m =>
            m.Status == GroupMemberStatusEnum.Confirmed ||
            m.Status == GroupMemberStatusEnum.Paired ||
            m.Status == GroupMemberStatusEnum.PaymentFailed ||
            m.Status == GroupMemberStatusEnum.Paid);
        if (!allConfirmed)
            throw new BadRequestException("Not all members have confirmed their seats yet", "GBK42");

        if (session.Status == GroupBookingStatusEnum.PayingIndividual ||
            session.Status == GroupBookingStatusEnum.PaymentFailedPartial ||
            session.PaymentMethod == GroupBookingPaymentMethodEnum.IndividualPay)
        {
            return await CreateIndividualPaymentAsync(session, member, ipAddress);
        }

        if (session.Status != GroupBookingStatusEnum.Confirming &&
            session.Status != GroupBookingStatusEnum.Paying &&
            session.Status != GroupBookingStatusEnum.PayingAll)
        {
            throw new BadRequestException("Group is not ready for payment.", "GBK40");
        }

        if (!member.IsHost)
            throw new BadRequestException("Only the host can initiate group payment", "GBK41");

        var totalAmount = activeMembers.Sum(m => m.AmountToPay);
        if (totalAmount <= 0)
            throw new BadRequestException("Total group amount must be greater than zero", "GBK43");

        var txnRef = $"GROUP-{session.GroupSessionId.ToString("N")[..12]}";

        var paymentUrl = _vnPayService.GenerateVnpayUrl(
            (long)totalAmount,
            txnRef,
            ipAddress);

        session.Status = GroupBookingStatusEnum.PayingAll;
        session.PaymentDeadlineAt = DateTime.UtcNow.AddMinutes(10);
        session.TotalGroupAmount = totalAmount;
        _groupBookingRepository.UpdateSession(session);

        await _unitOfWork.SaveChangesAsync();

        await _notificationService.NotifyGroupChatMessageAsync(session.GroupSessionId, new ResGroupChatMessageDto
        {
            MessageId = Guid.NewGuid(),
            SenderId = userId,
            SenderName = "System",
            Content = $"[Chủ phòng] đã bắt đầu thanh toán cho nhóm. Tổng: {totalAmount:N0}đ",
            MessageType = GroupChatMessageTypeEnum.PaymentEvent,
            CreatedAt = DateTime.UtcNow
        });

        var stateRes = await _getGroupBookingStateUseCase.ExecuteAsync(groupSessionId);
        if (stateRes.IsSuccess && stateRes.Data != null)
        {
            await _notificationService.NotifyGroupUpdateAsync(groupSessionId, stateRes.Data);
        }

        return new BaseResponse<ResPayGroupBookingDto>
        {
            IsSuccess = true,
            Data = new ResPayGroupBookingDto
            {
                PaymentUrl = paymentUrl,
                Amount = totalAmount
            },
            Message = "Payment URL generated successfully"
        };
    }

    private async Task<BaseResponse<ResPayGroupBookingDto>> CreateIndividualPaymentAsync(
        Domain.Entities.GroupBooking.GroupBookingSessionEntity session,
        Domain.Entities.GroupBooking.GroupBookingMemberEntity member,
        string ipAddress)
    {
        if (member.Status == GroupMemberStatusEnum.Paid)
            throw new BadRequestException("Your part has already been paid", "GBK44");

        var amount = member.AmountToPay - member.AmountPaid;
        if (amount <= 0)
            throw new BadRequestException("Your payment amount must be greater than zero", "GBK45");

        // Thêm timestamp vào TxnRef để tránh duplicate trên VNPay khi user retry
        var txnRef = $"GROUPMEM-{member.MemberId:N}-{DateTime.UtcNow.Ticks}";
        var paymentUrl = _vnPayService.GenerateVnpayUrl((long)amount, txnRef, ipAddress);

        session.Status = GroupBookingStatusEnum.PayingIndividual;
        session.PaymentDeadlineAt ??= DateTime.UtcNow.AddMinutes(10);
        session.TotalGroupAmount = session.Members
            .Where(m => m.Status != GroupMemberStatusEnum.Removed)
            .Sum(m => m.AmountToPay);
        _groupBookingRepository.UpdateSession(session);

        await _unitOfWork.SaveChangesAsync();

        await _notificationService.NotifyGroupChatMessageAsync(session.GroupSessionId, new ResGroupChatMessageDto
        {
            MessageId = Guid.NewGuid(),
            SenderId = member.UserId,
            SenderName = "System",
            Content = $"{member.UserInfoEntity?.UserName ?? "A member"} started their individual payment. Amount: {amount:N0}d",
            MessageType = GroupChatMessageTypeEnum.PaymentEvent,
            CreatedAt = DateTime.UtcNow
        });

        var stateRes = await _getGroupBookingStateUseCase.ExecuteAsync(session.GroupSessionId);
        if (stateRes.IsSuccess && stateRes.Data != null)
        {
            await _notificationService.NotifyGroupUpdateAsync(session.GroupSessionId, stateRes.Data);
        }

        return new BaseResponse<ResPayGroupBookingDto>
        {
            IsSuccess = true,
            Data = new ResPayGroupBookingDto
            {
                PaymentUrl = paymentUrl,
                Amount = amount
            },
            Message = "Individual payment URL generated successfully"
        };
    }
}
