using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Booking;

namespace Cinema.Application.Interfaces.Booking;

public interface ISeatLockerNotificationService
{
    Task NotifySeatsReleasedAsync(string scheduleId, List<string> seatIds);
    Task NotifySeatsUnavailableAsync(string scheduleId, List<string> seatIds, string? ownerToken = null);
    Task NotifyGroupSeatStateChangedAsync(string scheduleId, string seatId, string? userName, bool isLocked);
    Task NotifyGroupUpdateAsync(Guid groupSessionId, object state);
    Task NotifyPaymentMethodVoteUpdateAsync(Guid groupSessionId, object voteState);
    Task NotifyPaymentFailureVoteUpdateAsync(Guid groupSessionId, object failureVoteState);
    Task<Dictionary<string, string>> GetCurrentLockedSeatsAsync(string scheduleId);
    Task<Dictionary<string, (Guid GroupSessionId, Guid MemberId, string MemberName)>> GetGroupSelectionsForScheduleAsync(string scheduleId);
    Task<List<string>> GetGroupSelectedSeatsAsync(string scheduleId, Guid groupSessionId);
    Task<(List<string> ReleasedSeatIds, List<string> NewlySelectedSeatIds)> UpdateGroupMemberSelectionAsync(
        string scheduleId,
        Guid groupSessionId,
        Guid memberId,
        string memberName,
        List<GroupSeatSelectionDto> seatSelections,
        TimeSpan ttl);
    Task<IReadOnlyList<SeatLockInfo>> GetGroupMemberSelectionsAsync(string scheduleId, Guid groupSessionId, Guid memberId);
    Task<(bool Success, string? Message)> RenewGroupMemberSelectionsAsync(string scheduleId, Guid groupSessionId, Guid memberId, TimeSpan ttl);
    Task ClearGroupSelectionsAsync(string scheduleId, Guid groupSessionId);
    Task ClearGroupMemberSelectionsAsync(string scheduleId, Guid groupSessionId, Guid memberId);
    Task NotifyGroupChatMessageAsync(Guid groupSessionId, Cinema.Application.Dtos.Booking.ResGroupChatMessageDto chatMessage);
    Task NotifyGroupChatMessageAsync(Guid groupSessionId, Cinema.Application.Dtos.Booking.ResGroupChatMessageDto chatMessage, TimeSpan ttl);
    Task<List<Cinema.Application.Dtos.Booking.ResGroupChatMessageDto>> GetGroupChatMessagesAsync(Guid groupSessionId, int limit);
}
