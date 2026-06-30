using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class ConfirmGroupMemberSeatsUseCase
{
    private readonly IGroupBookingRepository _groupBookingRepository;
    private readonly IUserContextService _userContextService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISeatLockerNotificationService _notificationService;
    private readonly GetGroupBookingStateUseCase _getGroupBookingStateUseCase;

    public ConfirmGroupMemberSeatsUseCase(
        IGroupBookingRepository groupBookingRepository,
        IUserContextService userContextService,
        IUnitOfWork unitOfWork,
        ISeatLockerNotificationService notificationService,
        GetGroupBookingStateUseCase getGroupBookingStateUseCase)
    {
        _groupBookingRepository = groupBookingRepository;
        _userContextService = userContextService;
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
        _getGroupBookingStateUseCase = getGroupBookingStateUseCase;
    }

    public async Task<BaseResponse<ResConfirmGroupMemberSeatsDto>> ExecuteAsync(Guid groupSessionId, ReqConfirmGroupSeatsDto request)
    {
        var userId = _userContextService.GetUserId();

        var session = await _groupBookingRepository.GetSessionWithMembersAsync(groupSessionId);
        if (session == null)
            throw new NotFoundException("Group booking session not found");

        if (session.Status != GroupBookingStatusEnum.SeatsSelected && session.Status != GroupBookingStatusEnum.Confirming)
            throw new BadRequestException("Cannot confirm seats in current session status", "GBK30");

        var member = session.Members.FirstOrDefault(m => m.UserId == userId && m.Status != GroupMemberStatusEnum.Removed);
        if (member == null)
            throw new BadRequestException("You are not a member of this group", "GBK31");

        var memberSeats = member.SelectedSeats?.ToList() ?? [];
        if (memberSeats.Count == 0)
            throw new BadRequestException("You have no seats selected to confirm", "GBK32");

        foreach (var seat in memberSeats)
        {
            seat.IsConfirmed = true;
        }

        member.Status = GroupMemberStatusEnum.Confirmed;
        _groupBookingRepository.UpdateMember(member);

        var allMembers = session.Members.Where(m => m.Status != GroupMemberStatusEnum.Removed).ToList();
        var allConfirmed = allMembers.All(m => m.Status == GroupMemberStatusEnum.Confirmed || m.Status == GroupMemberStatusEnum.Paid);

        if (allConfirmed)
        {
            session.Status = GroupBookingStatusEnum.Confirming;
            _groupBookingRepository.UpdateSession(session);
        }

        await _unitOfWork.SaveChangesAsync();

        var user = await _groupBookingRepository.FindUserByIdAsync(userId);
        var userName = user?.UserName ?? "Member";
        var roleLabel = member.IsHost ? "[Chủ phòng]" : "[Thành viên]";

        await _notificationService.NotifyGroupChatMessageAsync(session.GroupSessionId, new ResGroupChatMessageDto
        {
            MessageId = Guid.NewGuid(),
            SenderId = userId,
            SenderName = "System",
            Content = allConfirmed
                ? $"{roleLabel} {userName} đã xác nhận ghế. Tất cả thành viên đã xác nhận - chờ chủ phòng thanh toán!"
                : $"{roleLabel} {userName} đã xác nhận ghế ({allMembers.Count(m => m.Status == GroupMemberStatusEnum.Confirmed)}/{allMembers.Count})",
            MessageType = GroupChatMessageTypeEnum.SystemEvent,
            CreatedAt = DateTime.UtcNow
        });

        var stateRes = await _getGroupBookingStateUseCase.ExecuteAsync(groupSessionId);
        var state = stateRes.Data;

        var confirmedCount = allMembers.Count(m => m.Status == GroupMemberStatusEnum.Confirmed);

        return new BaseResponse<ResConfirmGroupMemberSeatsDto>
        {
            IsSuccess = true,
            Data = new ResConfirmGroupMemberSeatsDto
            {
                IsAllConfirmed = allConfirmed,
                ConfirmedCount = confirmedCount,
                TotalMembers = allMembers.Count,
                SessionStatus = session.Status
            },
            Message = "Seats confirmed successfully"
        };
    }
}
