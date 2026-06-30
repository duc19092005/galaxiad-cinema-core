using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class GetGroupChatMessagesUseCase
{
    private readonly IGroupBookingRepository _groupBookingRepository;
    private readonly IUserContextService _userContextService;
    private readonly ISeatLockerNotificationService _notificationService;

    public GetGroupChatMessagesUseCase(
        IGroupBookingRepository groupBookingRepository,
        IUserContextService userContextService,
        ISeatLockerNotificationService notificationService)
    {
        _groupBookingRepository = groupBookingRepository;
        _userContextService = userContextService;
        _notificationService = notificationService;
    }

    public async Task<BaseResponse<List<ResGroupChatMessageDto>>> ExecuteAsync(
        Guid groupSessionId, int limit = 50, DateTime? before = null)
    {
        var userId = _userContextService.GetUserId();

        var member = await _groupBookingRepository.GetMemberAsync(groupSessionId, userId);
        if (member == null || member.Status == GroupMemberStatusEnum.Removed)
            throw new BadRequestException("You are not a member of this group", "GBK70");

        var messages = _notificationService.GetGroupChatMessages(groupSessionId);

        // Sort descending to return latest messages first as requested
        var sorted = messages
            .OrderByDescending(m => m.CreatedAt)
            .Take(limit)
            .ToList();

        return new BaseResponse<List<ResGroupChatMessageDto>>
        {
            IsSuccess = true,
            Data = sorted,
            Message = "Chat messages retrieved"
        };
    }
}
