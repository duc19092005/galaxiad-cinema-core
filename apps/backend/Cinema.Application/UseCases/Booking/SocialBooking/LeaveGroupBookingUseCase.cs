using System;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Entities.GroupBooking;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class LeaveGroupBookingUseCase
{
    private readonly IGroupBookingRepository _groupBookingRepository;
    private readonly IUserContextService _userContextService;
    private readonly ILogger<LeaveGroupBookingUseCase> _logger;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISeatLockerNotificationService _notificationService;
    private readonly GetGroupBookingStateUseCase _getGroupBookingStateUseCase;
    private readonly IGroupBookingCacheService _cache;
    private readonly IVoteTimeoutScheduler _voteTimeoutScheduler;

    public LeaveGroupBookingUseCase(
        IGroupBookingRepository groupBookingRepository,
        IUserContextService userContextService,
        ILogger<LeaveGroupBookingUseCase> logger,
        IUnitOfWork unitOfWork,
        ISeatLockerNotificationService notificationService,
        GetGroupBookingStateUseCase getGroupBookingStateUseCase,
        IGroupBookingCacheService cache,
        IVoteTimeoutScheduler voteTimeoutScheduler)
    {
        _groupBookingRepository = groupBookingRepository;
        _userContextService = userContextService;
        _logger = logger;
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
        _getGroupBookingStateUseCase = getGroupBookingStateUseCase;
        _cache = cache;
        _voteTimeoutScheduler = voteTimeoutScheduler;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid groupSessionId)
    {
        var userId = _userContextService.GetUserId();

        var session = await _groupBookingRepository.GetSessionWithMembersAsync(groupSessionId);
        if (session == null)
            throw new NotFoundException("Group booking session not found");

        var member = session.Members.FirstOrDefault(m => m.UserId == userId && m.Status != GroupMemberStatusEnum.Removed);
        if (member == null)
            throw new BadRequestException("You are not a member of this group", "GBK31");

        var user = await _groupBookingRepository.FindUserByIdAsync(userId);
        var userName = user?.UserName ?? "Member";
        var scheduleIdStr = session.MovieScheduleId.ToString();

        if (member.IsHost)
        {
            // Host leaves: Cancel the entire group booking session and release all seats
            session.Status = GroupBookingStatusEnum.Cancelled;
            _groupBookingRepository.UpdateSession(session);

            _notificationService.ClearGroupSelections(scheduleIdStr, session.GroupSessionId);

            foreach (var m in session.Members.Where(x => x.Status != GroupMemberStatusEnum.Removed))
            {
                m.Status = GroupMemberStatusEnum.Removed;
                _groupBookingRepository.UpdateMember(m);
            }

            await _notificationService.NotifyGroupChatMessageAsync(session.GroupSessionId, new ResGroupChatMessageDto
            {
                MessageId = Guid.NewGuid(),
                SenderId = userId,
                SenderName = "System",
                Content = "Chủ phòng đã rời đi và hủy phòng đặt chung.",
                MessageType = GroupChatMessageTypeEnum.SystemEvent,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            // Regular member leaves: Release only their seats
            _notificationService.ClearGroupMemberSelections(scheduleIdStr, session.GroupSessionId, member.MemberId);

            member.Status = GroupMemberStatusEnum.Removed;
            _groupBookingRepository.UpdateMember(member);

            await _notificationService.NotifyGroupChatMessageAsync(session.GroupSessionId, new ResGroupChatMessageDto
            {
                MessageId = Guid.NewGuid(),
                SenderId = userId,
                SenderName = "System",
                Content = $"[Thành viên] {userName} đã rời khỏi nhóm.",
                MessageType = GroupChatMessageTypeEnum.SystemEvent,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _unitOfWork.SaveChangesAsync();

        if (member.IsHost)
        {
            await _cache.ClearAllGroupDataAsync(groupSessionId);
            _voteTimeoutScheduler.Cancel(groupSessionId);
        }

        // Broadcast updated group state via SSE
        var updatedState = await _getGroupBookingStateUseCase.ExecuteAsync(groupSessionId);
        if (updatedState.IsSuccess && updatedState.Data != null)
        {
            await _notificationService.NotifyGroupUpdateAsync(groupSessionId, updatedState.Data);
        }

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = member.IsHost ? "Group booking cancelled successfully" : "Left group successfully"
        };
    }
}
