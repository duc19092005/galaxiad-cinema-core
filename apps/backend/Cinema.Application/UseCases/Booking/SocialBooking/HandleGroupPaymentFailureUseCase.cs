using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Entities.GroupBooking;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class HandleGroupPaymentFailureUseCase
{
    private readonly IGroupBookingRepository _groupBookingRepository;
    private readonly IUserContextService _userContextService;
    private readonly IVnPayService _vnPayService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<HandleGroupPaymentFailureUseCase> _logger;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISeatLockerNotificationService _notificationService;

    public HandleGroupPaymentFailureUseCase(
        IGroupBookingRepository groupBookingRepository,
        IUserContextService userContextService,
        IVnPayService vnPayService,
        IConfiguration configuration,
        ILogger<HandleGroupPaymentFailureUseCase> logger,
        IUnitOfWork unitOfWork,
        ISeatLockerNotificationService notificationService)
    {
        _groupBookingRepository = groupBookingRepository;
        _userContextService = userContextService;
        _vnPayService = vnPayService;
        _configuration = configuration;
        _logger = logger;
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
    }

    public async Task<BaseResponse<ResGroupPaymentActionDto>> ExecuteAsync(
        Guid groupSessionId, ReqGroupPaymentActionDto request, string ipAddress)
    {
        var userId = _userContextService.GetUserId();

        var session = await _groupBookingRepository.GetSessionWithMembersAsync(groupSessionId);
        if (session == null)
            throw new NotFoundException("Group booking session not found");

        var hostMember = session.Members.FirstOrDefault(m => m.IsHost && m.UserId == userId);
        if (hostMember == null)
            throw new BadRequestException("Only the group host can take payment actions", "GBK61");

        if (session.Status != GroupBookingStatusEnum.PaymentFailed)
            throw new BadRequestException("No payment failure to handle", "GBK62");

        var result = request.Action switch
        {
            GroupPaymentActionEnum.Cover => new BaseResponse<ResGroupPaymentActionDto>
            {
                IsSuccess = true,
                Data = await HandleCoverAsync(session, ipAddress),
                Message = "Cover action processed"
            },
            GroupPaymentActionEnum.TakeOverAll => new BaseResponse<ResGroupPaymentActionDto>
            {
                IsSuccess = true,
                Data = await HandleTakeOverAllAsync(session, ipAddress),
                Message = "Take over all action processed"
            },
            GroupPaymentActionEnum.CancelGroup => new BaseResponse<ResGroupPaymentActionDto>
            {
                IsSuccess = true,
                Data = await HandleCancelGroupAsync(session),
                Message = "Cancel group action processed"
            },
            _ => throw new BadRequestException("Invalid payment action", "GBK63")
        };

        await _unitOfWork.SaveChangesAsync();
        return result;
    }

    private async Task<ResGroupPaymentActionDto> HandleCoverAsync(GroupBookingSessionEntity session, string ipAddress)
    {
        var failedMembers = session.Members
            .Where(m => m.Status == GroupMemberStatusEnum.PaymentFailed)
            .ToList();

        if (!failedMembers.Any())
            throw new BadRequestException("No failed payments to cover", "GBK64");

        var coverAmount = failedMembers.Sum(m => m.AmountToPay - m.AmountPaid);
        var hostMember = session.Members.First(m => m.IsHost);

        var paymentUrl = _vnPayService.GenerateVnpayUrl(
            (long)coverAmount,
            $"GROUP-COVER-{session.GroupSessionId}",
            ipAddress);

        session.Status = GroupBookingStatusEnum.Paying;
        session.PaymentDeadlineAt = DateTime.UtcNow.AddMinutes(5);
        _groupBookingRepository.UpdateSession(session);

        foreach (var member in failedMembers)
        {
            member.Status = GroupMemberStatusEnum.Covered;
            _groupBookingRepository.UpdateMember(member);
        }

        return new ResGroupPaymentActionDto
        {
            Action = GroupPaymentActionEnum.Cover,
            Message = $"Host is covering {failedMembers.Count} failed payment(s). Amount: {coverAmount:N0} VND",
            PaymentUrl = paymentUrl,
            Amount = coverAmount,
            IsSuccess = true
        };
    }

    private async Task<ResGroupPaymentActionDto> HandleTakeOverAllAsync(GroupBookingSessionEntity session, string ipAddress)
    {
        var failedMembers = session.Members
            .Where(m => m.Status == GroupMemberStatusEnum.PaymentFailed)
            .ToList();

        var remainingAmount = session.TotalGroupAmount - session.CollectedAmount;

        var hostMember = session.Members.First(m => m.IsHost);
        if (hostMember.AmountPaid >= remainingAmount)
            throw new BadRequestException("Host has already paid enough", "GBK65");

        var paymentUrl = _vnPayService.GenerateVnpayUrl(
            (long)remainingAmount,
            $"GROUP-TAKEOVER-{session.GroupSessionId}",
            ipAddress);

        session.Status = GroupBookingStatusEnum.Paying;
        session.PaymentDeadlineAt = DateTime.UtcNow.AddMinutes(5);
        _groupBookingRepository.UpdateSession(session);

        foreach (var member in failedMembers)
        {
            member.Status = GroupMemberStatusEnum.Covered;
            _groupBookingRepository.UpdateMember(member);
        }

        return new ResGroupPaymentActionDto
        {
            Action = GroupPaymentActionEnum.TakeOverAll,
            Message = $"Host is taking over all remaining payments. Amount: {remainingAmount:N0} VND",
            PaymentUrl = paymentUrl,
            Amount = remainingAmount,
            IsSuccess = true
        };
    }

    private async Task<ResGroupPaymentActionDto> HandleCancelGroupAsync(GroupBookingSessionEntity session)
    {
        var paidMembers = session.Members
            .Where(m => m.Status == GroupMemberStatusEnum.Paid)
            .ToList();

        session.Status = GroupBookingStatusEnum.Cancelled;
        session.CollectedAmount = 0;
        _groupBookingRepository.UpdateSession(session);

        foreach (var member in paidMembers)
        {
            member.AmountPaid = 0;
            member.Status = GroupMemberStatusEnum.Removed;
            _groupBookingRepository.UpdateMember(member);
        }

        foreach (var seat in session.Members.SelectMany(m => m.SelectedSeats))
        {
            seat.IsConfirmed = false;
        }

        await _notificationService.NotifyGroupChatMessageAsync(session.GroupSessionId, new ResGroupChatMessageDto
        {
            MessageId = Guid.NewGuid(),
            SenderId = Guid.Empty,
            SenderName = "System",
            Content = "Nhóm đã bị hủy. Tiền đã hoàn vào ví ứng dụng.",
            MessageType = GroupChatMessageTypeEnum.PaymentEvent,
            CreatedAt = DateTime.UtcNow
        });

        return new ResGroupPaymentActionDto
        {
            Action = GroupPaymentActionEnum.CancelGroup,
            Message = "Group cancelled. Credits have been refunded to app wallet.",
            Amount = 0,
            IsSuccess = true
        };
    }
}
