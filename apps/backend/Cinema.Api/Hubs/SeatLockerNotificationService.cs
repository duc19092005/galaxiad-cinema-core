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
    private readonly IGroupBookingCacheService _groupBookingCacheService;

    public SeatLockerNotificationService(
        SeatLockManager seatLockManager,
        GroupBookingWsManager groupBookingWsManager,
        IGroupBookingCacheService groupBookingCacheService)
    {
        _seatLockManager = seatLockManager;
        _groupBookingWsManager = groupBookingWsManager;
        _groupBookingCacheService = groupBookingCacheService;
    }

    public Task NotifySeatsReleasedAsync(string scheduleId, List<string> seatIds)
    {
        return _seatLockManager.ReleaseSeatsForScheduleAsync(scheduleId, seatIds);
    }

    public Task NotifySeatsUnavailableAsync(string scheduleId, List<string> seatIds, string? ownerToken = null)
    {
        return _seatLockManager.NotifySeatsUnavailableAsync(scheduleId, seatIds, ownerToken);
    }

    public Task NotifyGroupSeatStateChangedAsync(string scheduleId, string seatId, string? userName, bool isLocked)
    {
        return _seatLockManager.BroadcastGroupSeatLockStateAsync(scheduleId, seatId, userName, isLocked);
    }

    public async Task NotifyGroupUpdateAsync(Guid groupSessionId, object state)
    {
        await _groupBookingWsManager.BroadcastAsync(groupSessionId, new { type = "group-update", state });
    }

    public async Task NotifyPaymentMethodVoteUpdateAsync(Guid groupSessionId, object voteState)
    {
        await _groupBookingWsManager.BroadcastAsync(groupSessionId, new { type = "payment-method-vote-update", voteState });
    }

    public async Task NotifyPaymentFailureVoteUpdateAsync(Guid groupSessionId, object failureVoteState)
    {
        await _groupBookingWsManager.BroadcastAsync(groupSessionId, new { type = "payment-failure-vote-update", failureVoteState });
    }

    public Task<Dictionary<string, string>> GetCurrentLockedSeatsAsync(string scheduleId)
    {
        return _seatLockManager.GetCurrentLockedSeatsAsync(scheduleId);
    }

    public Task<Dictionary<string, (Guid GroupSessionId, Guid MemberId, string MemberName)>> GetGroupSelectionsForScheduleAsync(string scheduleId)
    {
        return _seatLockManager.GetGroupSelectionsForScheduleAsync(scheduleId);
    }

    public Task<List<string>> GetGroupSelectedSeatsAsync(string scheduleId, Guid groupSessionId)
    {
        return _seatLockManager.GetGroupSelectedSeatsAsync(scheduleId, groupSessionId);
    }

    public Task<(List<string> ReleasedSeatIds, List<string> NewlySelectedSeatIds)> UpdateGroupMemberSelectionAsync(
        string scheduleId, Guid groupSessionId, Guid memberId, string memberName, List<Cinema.Application.Dtos.Booking.GroupSeatSelectionDto> seatSelections, TimeSpan ttl)
    {
        return _seatLockManager.UpdateGroupMemberSelectionAsync(scheduleId, groupSessionId, memberId, memberName, seatSelections, ttl);
    }

    public async Task<IReadOnlyList<SeatLockInfo>> GetGroupMemberSelectionsAsync(string scheduleId, Guid groupSessionId, Guid memberId)
    {
        var ownerToken = SeatLockManager.GroupOwnerToken(groupSessionId, memberId);
        return await _seatLockManager.GetSeatLockServiceLocksForOwnerAsync(scheduleId, ownerToken);
    }

    public Task<(bool Success, string? Message)> RenewGroupMemberSelectionsAsync(
        string scheduleId,
        Guid groupSessionId,
        Guid memberId,
        TimeSpan ttl)
    {
        return _seatLockManager.RenewGroupMemberSelectionsAsync(scheduleId, groupSessionId, memberId, ttl);
    }

    public Task ClearGroupSelectionsAsync(string scheduleId, Guid groupSessionId)
    {
        return _seatLockManager.ClearGroupSelectionsAsync(scheduleId, groupSessionId);
    }

    public Task ClearGroupMemberSelectionsAsync(string scheduleId, Guid groupSessionId, Guid memberId)
    {
        return _seatLockManager.ClearGroupMemberSelectionsAsync(scheduleId, groupSessionId, memberId);
    }

    public Task NotifyGroupChatMessageAsync(Guid groupSessionId, Cinema.Application.Dtos.Booking.ResGroupChatMessageDto chatMessage)
    {
        return NotifyGroupChatMessageAsync(groupSessionId, chatMessage, TimeSpan.FromHours(24));
    }

    public async Task NotifyGroupChatMessageAsync(Guid groupSessionId, Cinema.Application.Dtos.Booking.ResGroupChatMessageDto chatMessage, TimeSpan ttl)
    {
        await _groupBookingCacheService.AddChatMessageAsync(groupSessionId, chatMessage, ttl);
        await _groupBookingWsManager.BroadcastAsync(groupSessionId, new { type = "chat-message", chatMessage });
    }

    public Task<List<Cinema.Application.Dtos.Booking.ResGroupChatMessageDto>> GetGroupChatMessagesAsync(Guid groupSessionId, int limit)
    {
        return _groupBookingCacheService.GetChatMessagesAsync(groupSessionId, limit);
    }
}
