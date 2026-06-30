using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Entities.GroupBooking;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Enums;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class JoinGroupBookingUseCase
{
    private readonly IGroupBookingRepository _groupBookingRepository;
    private readonly IUserContextService _userContextService;
    private readonly ILogger<JoinGroupBookingUseCase> _logger;
    private readonly IUnitOfWork _unitOfWork;
    private readonly GetGroupBookingStateUseCase _getGroupBookingStateUseCase;
    private readonly ISeatLockerNotificationService _notificationService;

    public JoinGroupBookingUseCase(
        IGroupBookingRepository groupBookingRepository,
        IUserContextService userContextService,
        ILogger<JoinGroupBookingUseCase> logger,
        IUnitOfWork unitOfWork,
        GetGroupBookingStateUseCase getGroupBookingStateUseCase,
        ISeatLockerNotificationService notificationService)
    {
        _groupBookingRepository = groupBookingRepository;
        _userContextService = userContextService;
        _logger = logger;
        _unitOfWork = unitOfWork;
        _getGroupBookingStateUseCase = getGroupBookingStateUseCase;
        _notificationService = notificationService;
    }

    public async Task<BaseResponse<ResGroupBookingStateDto>> ExecuteAsync(ReqJoinGroupBookingDto request)
    {
        var userId = _userContextService.GetUserId();

        var session = await _groupBookingRepository.GetSessionByCodeAsync(request.GroupCode);
        if (session == null)
            throw new NotFoundException("Group booking session not found");

        if (session.Status == GroupBookingStatusEnum.Cancelled)
            throw new BadRequestException("This group booking session is no longer active", "GBK11");

        if (session.ExpiresAt.HasValue && session.ExpiresAt.Value < DateTime.UtcNow
            && session.Status != GroupBookingStatusEnum.Completed)
            throw new BadRequestException("This group booking session has expired", "GBK12");

        var existingMember = await _groupBookingRepository.GetMemberAsync(session.GroupSessionId, userId);
        if (existingMember != null)
        {
            if (existingMember.Status == GroupMemberStatusEnum.Removed)
            {
                existingMember.Status = GroupMemberStatusEnum.Joined;
                existingMember.JoinedAt = DateTime.UtcNow;
                _groupBookingRepository.UpdateMember(existingMember);
                await _unitOfWork.SaveChangesAsync();
            }

            var stateRes = await _getGroupBookingStateUseCase.ExecuteAsync(session.GroupSessionId);
            return new BaseResponse<ResGroupBookingStateDto>
            {
                IsSuccess = true,
                Data = stateRes.Data,
                Message = "Already a member of this group"
            };
        }

        if (session.Status == GroupBookingStatusEnum.Completed)
            throw new BadRequestException("This group booking session is no longer active", "GBK11");

        var memberCount = await _groupBookingRepository.GetMemberCountAsync(session.GroupSessionId);
        if (memberCount >= session.MaxMembers)
            throw new BadRequestException("This group is full", "GBK13");

        var member = new GroupBookingMemberEntity
        {
            MemberId = Guid.NewGuid(),
            GroupSessionId = session.GroupSessionId,
            UserId = userId,
            IsHost = false,
            Status = GroupMemberStatusEnum.Joined,
            AmountToPay = 0,
            AmountPaid = 0,
            JoinedAt = DateTime.UtcNow
        };

        var user = await _groupBookingRepository.FindUserByIdAsync(userId);

        await _groupBookingRepository.AddMemberAsync(member);

        await _unitOfWork.SaveChangesAsync();

        // Save and broadcast join chat message in-memory (after SaveChanges to ensure member exists)
        await _notificationService.NotifyGroupChatMessageAsync(session.GroupSessionId, new ResGroupChatMessageDto
        {
            MessageId = Guid.NewGuid(),
            SenderId = userId,
            SenderName = "System",
            Content = $"[Thành viên] {user?.UserName ?? "Member"} đã tham gia nhóm",
            MessageType = GroupChatMessageTypeEnum.SystemEvent,
            CreatedAt = DateTime.UtcNow
        });

        var finalStateRes = await _getGroupBookingStateUseCase.ExecuteAsync(session.GroupSessionId);

        return new BaseResponse<ResGroupBookingStateDto>
        {
            IsSuccess = true,
            Data = finalStateRes.Data,
            Message = "Successfully joined the group"
        };
    }
}
