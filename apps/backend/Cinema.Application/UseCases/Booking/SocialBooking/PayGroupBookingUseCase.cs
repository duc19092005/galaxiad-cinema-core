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

    public PayGroupBookingUseCase(
        IGroupBookingRepository groupBookingRepository,
        IUserContextService userContextService,
        IUnitOfWork unitOfWork,
        IVnPayService vnPayService,
        IConfiguration configuration,
        ISeatLockerNotificationService notificationService,
        GetGroupBookingStateUseCase getGroupBookingStateUseCase)
    {
        _groupBookingRepository = groupBookingRepository;
        _userContextService = userContextService;
        _unitOfWork = unitOfWork;
        _vnPayService = vnPayService;
        _configuration = configuration;
        _notificationService = notificationService;
        _getGroupBookingStateUseCase = getGroupBookingStateUseCase;
    }

    public async Task<BaseResponse<ResPayGroupBookingDto>> ExecuteAsync(Guid groupSessionId, string ipAddress)
    {
        var userId = _userContextService.GetUserId();

        var session = await _groupBookingRepository.GetSessionWithMembersAsync(groupSessionId);
        if (session == null)
            throw new NotFoundException("Group booking session not found");

        if (session.Status != GroupBookingStatusEnum.Confirming)
            throw new BadRequestException("Group is not ready for payment. All members must confirm their seats first.", "GBK40");

        var member = session.Members.FirstOrDefault(m => m.UserId == userId && m.Status != GroupMemberStatusEnum.Removed);
        if (member == null || !member.IsHost)
            throw new BadRequestException("Only the host can initiate group payment", "GBK41");

        var activeMembers = session.Members.Where(m => m.Status != GroupMemberStatusEnum.Removed).ToList();
        var allConfirmed = activeMembers.All(m =>
            m.Status == GroupMemberStatusEnum.Confirmed || m.Status == GroupMemberStatusEnum.Paid);
        if (!allConfirmed)
            throw new BadRequestException("Not all members have confirmed their seats yet", "GBK42");

        var totalAmount = activeMembers.Sum(m => m.AmountToPay);
        if (totalAmount <= 0)
            throw new BadRequestException("Total group amount must be greater than zero", "GBK43");

        var txnRef = $"GROUP-{session.GroupSessionId.ToString("N")[..12]}";

        var paymentUrl = _vnPayService.GenerateVnpayUrl(
            (long)totalAmount,
            txnRef,
            ipAddress);

        session.Status = GroupBookingStatusEnum.Paying;
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
}
