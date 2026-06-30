using Cinema.Application.Infrastructure.Booking;
using Cinema.Application.Interfaces.Booking;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;

namespace Cinema.Api.Hubs;

public class SeatLockerNotificationService : ISeatLockerNotificationService
{
    private readonly SeatLockManager _seatLockManager;
    private readonly GroupBookingWsManager _groupBookingWsManager;

    public SeatLockerNotificationService(
        SeatLockManager seatLockManager,
        GroupBookingWsManager groupBookingWsManager)
    {
        _seatLockManager = seatLockManager;
        _groupBookingWsManager = groupBookingWsManager;
    }

    public Task NotifySeatsReleasedAsync(string scheduleId, List<string> seatIds)
    {
        _seatLockManager.ReleaseSeatsForSchedule(scheduleId, seatIds);
        return Task.CompletedTask;
    }

    public Task NotifyGroupSeatStateChangedAsync(string scheduleId, string seatId, string? userName, bool isLocked)
    {
        _seatLockManager.BroadcastGroupSeatLockState(scheduleId, seatId, userName, isLocked);
        return Task.CompletedTask;
    }

    public async Task NotifyGroupUpdateAsync(Guid groupSessionId, object state)
    {
        await _groupBookingWsManager.BroadcastAsync(groupSessionId, new { type = "group-update", state });
    }

    public Dictionary<string, string> GetCurrentLockedSeats(string scheduleId)
    {
        return _seatLockManager.GetCurrentLockedSeats(scheduleId);
    }

    public Dictionary<string, (Guid GroupSessionId, Guid MemberId, string MemberName)> GetGroupSelectionsForSchedule(string scheduleId)
    {
        return _seatLockManager.GetGroupSelectionsForSchedule(scheduleId);
    }

    public List<string> GetGroupSelectedSeats(string scheduleId, Guid groupSessionId)
    {
        return _seatLockManager.GetGroupSelectedSeats(scheduleId, groupSessionId);
    }

    public (List<string> ReleasedSeatIds, List<string> NewlySelectedSeatIds) UpdateGroupMemberSelection(
        string scheduleId, Guid groupSessionId, Guid memberId, string memberName, List<string> seatIds)
    {
        return _seatLockManager.UpdateGroupMemberSelection(scheduleId, groupSessionId, memberId, memberName, seatIds);
    }

    public void ClearGroupSelections(string scheduleId, Guid groupSessionId)
    {
        _seatLockManager.ClearGroupSelections(scheduleId, groupSessionId);
    }

    public void ClearGroupMemberSelections(string scheduleId, Guid groupSessionId, Guid memberId)
    {
        _seatLockManager.ClearGroupMemberSelections(scheduleId, groupSessionId, memberId);
    }

    public async Task NotifyGroupChatMessageAsync(Guid groupSessionId, Cinema.Application.Dtos.Booking.ResGroupChatMessageDto chatMessage)
    {
        _groupBookingWsManager.AddChatMessage(groupSessionId, chatMessage);
        await _groupBookingWsManager.BroadcastAsync(groupSessionId, new { type = "chat-message", chatMessage });
    }

    public List<Cinema.Application.Dtos.Booking.ResGroupChatMessageDto> GetGroupChatMessages(Guid groupSessionId)
    {
        return _groupBookingWsManager.GetChatMessages(groupSessionId);
    }
}
