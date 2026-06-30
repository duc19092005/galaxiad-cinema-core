using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Cinema.Application.Interfaces.Booking;

public interface ISeatLockerNotificationService
{
    Task NotifySeatsReleasedAsync(string scheduleId, List<string> seatIds);
    Task NotifyGroupSeatStateChangedAsync(string scheduleId, string seatId, string? userName, bool isLocked);
    Task NotifyGroupUpdateAsync(Guid groupSessionId, object state);
    Dictionary<string, string> GetCurrentLockedSeats(string scheduleId);
    Dictionary<string, (Guid GroupSessionId, Guid MemberId, string MemberName)> GetGroupSelectionsForSchedule(string scheduleId);
    List<string> GetGroupSelectedSeats(string scheduleId, Guid groupSessionId);
    (List<string> ReleasedSeatIds, List<string> NewlySelectedSeatIds) UpdateGroupMemberSelection(string scheduleId, Guid groupSessionId, Guid memberId, string memberName, List<string> seatIds);
    void ClearGroupSelections(string scheduleId, Guid groupSessionId);
    void ClearGroupMemberSelections(string scheduleId, Guid groupSessionId, Guid memberId);
    Task NotifyGroupChatMessageAsync(Guid groupSessionId, Cinema.Application.Dtos.Booking.ResGroupChatMessageDto chatMessage);
    List<Cinema.Application.Dtos.Booking.ResGroupChatMessageDto> GetGroupChatMessages(Guid groupSessionId);
}
