using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Entities.GroupBooking;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class SendGroupChatMessageUseCase
{
    private readonly IGroupBookingRepository _groupBookingRepository;
    private readonly IUserContextService _userContextService;
    private readonly ISeatLockerNotificationService _notificationService;

    public SendGroupChatMessageUseCase(
        IGroupBookingRepository groupBookingRepository,
        IUserContextService userContextService,
        ISeatLockerNotificationService notificationService)
    {
        _groupBookingRepository = groupBookingRepository;
        _userContextService = userContextService;
        _notificationService = notificationService;
    }

    public async Task<BaseResponse<ResGroupChatMessageDto>> ExecuteAsync(Guid groupSessionId, ReqSendGroupChatDto request)
    {
        var userId = _userContextService.GetUserId();

        var session = await _groupBookingRepository.GetSessionByIdAsync(groupSessionId);
        if (session == null)
            throw new NotFoundException("Group booking session not found");

        if (session.Status == GroupBookingStatusEnum.Cancelled || session.Status == GroupBookingStatusEnum.Completed)
            throw new BadRequestException("Cannot send messages in this session", "GBK31");

        var member = await _groupBookingRepository.GetMemberAsync(groupSessionId, userId);
        if (member == null || member.Status == GroupMemberStatusEnum.Removed)
            throw new BadRequestException("You are not a member of this group", "GBK32");

        var user = await _groupBookingRepository.FindUserByIdAsync(userId);

        var messageDto = new ResGroupChatMessageDto
        {
            MessageId = Guid.NewGuid(),
            SenderId = userId,
            SenderName = user?.UserName ?? string.Empty,
            SenderAvatarUrl = user?.PortraitImageUrl,
            Content = request.Content.Trim(),
            MessageType = GroupChatMessageTypeEnum.Text,
            CreatedAt = DateTime.UtcNow
        };

        await _notificationService.NotifyGroupChatMessageAsync(groupSessionId, messageDto);

        return new BaseResponse<ResGroupChatMessageDto>
        {
            IsSuccess = true,
            Data = messageDto,
            Message = "Message sent"
        };
    }
}
