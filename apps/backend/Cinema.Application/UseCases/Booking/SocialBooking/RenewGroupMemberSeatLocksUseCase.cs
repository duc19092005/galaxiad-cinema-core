using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class RenewGroupMemberSeatLocksUseCase
{
    private readonly IGroupBookingRepository _groupBookingRepository;
    private readonly IUserContextService _userContextService;
    private readonly ISeatLockerNotificationService _notificationService;
    private readonly GetGroupBookingStateUseCase _getGroupBookingStateUseCase;

    public RenewGroupMemberSeatLocksUseCase(
        IGroupBookingRepository groupBookingRepository,
        IUserContextService userContextService,
        ISeatLockerNotificationService notificationService,
        GetGroupBookingStateUseCase getGroupBookingStateUseCase)
    {
        _groupBookingRepository = groupBookingRepository;
        _userContextService = userContextService;
        _notificationService = notificationService;
        _getGroupBookingStateUseCase = getGroupBookingStateUseCase;
    }

    public async Task<BaseResponse<ResGroupBookingStateDto>> ExecuteAsync(Guid groupSessionId)
    {
        var userId = _userContextService.GetUserId();
        var session = await _groupBookingRepository.GetSessionWithMembersAsync(groupSessionId);
        if (session == null)
            throw new NotFoundException("Group booking session not found");

        var member = session.Members.FirstOrDefault(m => m.UserId == userId && m.Status != GroupMemberStatusEnum.Removed);
        if (member == null)
            throw new BadRequestException("You are not a member of this group", "GBK70");

        if (session.Status != GroupBookingStatusEnum.Open && session.Status != GroupBookingStatusEnum.SeatsSelected)
            throw new BadRequestException("Cannot renew seat locks in current session status", "GBK71");

        var ttl = GroupBookingCacheTtl.ForGroup(session.ExpiresAt);
        var result = await _notificationService.RenewGroupMemberSelectionsAsync(
            session.MovieScheduleId.ToString(),
            session.GroupSessionId,
            member.MemberId,
            ttl);

        if (!result.Success)
            throw new BadRequestException(result.Message ?? "Cannot renew seat locks", "GBK72");

        return await _getGroupBookingStateUseCase.ExecuteAsync(groupSessionId);
    }
}
