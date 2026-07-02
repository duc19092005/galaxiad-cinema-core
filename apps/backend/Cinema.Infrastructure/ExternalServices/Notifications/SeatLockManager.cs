using Cinema.Application.Interfaces.Booking;

namespace Cinema.Infrastructure.ExternalServices.Notifications;

/// <summary>
/// Coordinates Redis-backed seat locks and broadcasts lock changes via SignalR.
/// </summary>
public class SeatLockManager
{
    private static readonly TimeSpan DefaultSeatLockTtl = TimeSpan.FromMinutes(10);
    private readonly ISeatBroadcaster _broadcaster;
    private readonly ISeatLockService _seatLockService;

    public SeatLockManager(ISeatBroadcaster broadcaster, ISeatLockService seatLockService)
    {
        _broadcaster = broadcaster;
        _seatLockService = seatLockService;
    }

    public async Task<(bool Success, string? Message, Dictionary<string, string> LockedSeats)> LockSeatAsync(
        string scheduleId,
        string seatId,
        string userName,
        string clientId)
    {
        var result = await _seatLockService.TryLockSeatAsync(
            scheduleId,
            seatId,
            userName,
            clientId,
            ownerType: "booking",
            ttl: DefaultSeatLockTtl);

        var lockedSeats = await GetCurrentLockedSeatsAsync(scheduleId);
        if (result.Success)
        {
            await BroadcastEventAsync(scheduleId, "seat-locked", new
            {
                seatId,
                userName = result.CurrentLock?.UserName ?? userName,
                lockedSeats
            });
        }

        return (result.Success, result.Message, lockedSeats);
    }

    public async Task<(bool Success, string? Message, Dictionary<string, string> LockedSeats)> UnlockSeatAsync(
        string scheduleId,
        string seatId,
        string? clientId = null)
    {
        var success = clientId == null
            ? await ForceUnlockSeatAsync(scheduleId, seatId)
            : await _seatLockService.UnlockSeatAsync(scheduleId, seatId, clientId);

        var lockedSeats = await GetCurrentLockedSeatsAsync(scheduleId);
        if (success)
        {
            await BroadcastEventAsync(scheduleId, "seat-unlocked", new { seatId, lockedSeats });
        }

        return (success, success ? "Seat unlocked successfully" : "Cannot unlock seat locked by another user", lockedSeats);
    }

    public async Task<(bool Success, string? Message, Dictionary<string, string> LockedSeats)> RenewSeatLocksAsync(
        string scheduleId,
        string clientId)
    {
        var result = await _seatLockService.RenewLocksForOwnerAsync(scheduleId, clientId, DefaultSeatLockTtl);
        var lockedSeats = await GetCurrentLockedSeatsAsync(scheduleId);

        return (result.Success, result.Message, lockedSeats);
    }

    public async Task ReleaseSeatsByClientAsync(string clientId)
    {
        var locks = await GetLocksByOwnerAcrossSchedulesAsync(clientId);
        await _seatLockService.ReleaseSeatsByOwnerAsync(clientId);

        foreach (var lockInfo in locks)
        {
            var lockedSeats = await GetCurrentLockedSeatsAsync(lockInfo.ScheduleId);
            await BroadcastEventAsync(lockInfo.ScheduleId, "seat-unlocked", new { seatId = lockInfo.SeatId, lockedSeats });
        }
    }

    public async Task ReleaseSeatsForScheduleAsync(string scheduleId, List<string> seatIds)
    {
        await _seatLockService.ReleaseSeatsForScheduleAsync(scheduleId, seatIds);

        foreach (var seatId in seatIds)
        {
            var lockedSeats = await GetCurrentLockedSeatsAsync(scheduleId);
            await BroadcastEventAsync(scheduleId, "seat-unlocked", new { seatId, lockedSeats });
        }
    }

    public async Task NotifySeatsUnavailableAsync(string scheduleId, List<string> seatIds, string? ownerToken = null)
    {
        if (!string.IsNullOrWhiteSpace(ownerToken))
            await _seatLockService.ReleaseSeatsByOwnerAsync(ownerToken);
        else
            await _seatLockService.ReleaseSeatsForScheduleAsync(scheduleId, seatIds);

        foreach (var seatId in seatIds)
        {
            var lockedSeats = await GetCurrentLockedSeatsAsync(scheduleId);
            await BroadcastEventAsync(scheduleId, "seat-unavailable", new { seatId, lockedSeats });
        }
    }

    public async Task<Dictionary<string, string>> GetCurrentLockedSeatsAsync(string scheduleId)
    {
        var locks = await _seatLockService.GetLocksForScheduleAsync(scheduleId);
        return locks.ToDictionary(l => l.SeatId.ToLowerInvariant(), l => l.UserName);
    }

    public async Task<Dictionary<string, (Guid GroupSessionId, Guid MemberId, string MemberName)>> GetGroupSelectionsForScheduleAsync(string scheduleId)
    {
        var locks = await _seatLockService.GetLocksForScheduleAsync(scheduleId);
        return locks
            .Where(l => l.OwnerType == "group-booking" && l.GroupSessionId.HasValue && l.MemberId.HasValue)
            .ToDictionary(
                l => l.SeatId.ToLowerInvariant(),
                l => (l.GroupSessionId!.Value, l.MemberId!.Value, l.UserName));
    }

    public async Task<List<string>> GetGroupSelectedSeatsAsync(string scheduleId, Guid groupSessionId)
    {
        var locks = await _seatLockService.GetLocksForScheduleAsync(scheduleId);
        return locks
            .Where(l => l.OwnerType == "group-booking" && l.GroupSessionId == groupSessionId)
            .Select(l => l.SeatId.ToLowerInvariant())
            .ToList();
    }

    public Task<IReadOnlyList<SeatLockInfo>> GetSeatLockServiceLocksForOwnerAsync(string scheduleId, string ownerToken)
    {
        return _seatLockService.GetLocksForOwnerAsync(scheduleId, ownerToken);
    }

    public async Task<(List<string> ReleasedSeatIds, List<string> NewlySelectedSeatIds)> UpdateGroupMemberSelectionAsync(
        string scheduleId,
        Guid groupSessionId,
        Guid memberId,
        string memberName,
        List<Cinema.Application.Dtos.Booking.GroupSeatSelectionDto> seatSelections,
        TimeSpan ttl)
    {
        var ownerToken = GroupOwnerToken(groupSessionId, memberId);
        var selectionBySeatId = seatSelections
            .GroupBy(s => s.SeatId.ToString().ToLowerInvariant())
            .ToDictionary(g => g.Key, g => g.First().UserSegmentId);
        var normalizedSeatIds = selectionBySeatId.Keys.ToList();
        var existingLocks = await _seatLockService.GetLocksForOwnerAsync(scheduleId, ownerToken);
        var existingSeatIds = existingLocks.Select(l => l.SeatId.ToLowerInvariant()).ToList();

        var releasedSeatIds = existingSeatIds.Except(normalizedSeatIds).ToList();
        var newlySelectedSeatIds = normalizedSeatIds.Except(existingSeatIds).ToList();
        var acquired = new List<string>();

        foreach (var seatId in newlySelectedSeatIds)
        {
            var result = await _seatLockService.TryLockSeatAsync(
                scheduleId,
                seatId,
                memberName,
                ownerToken,
                ownerType: "group-booking",
                ttl,
                groupSessionId,
                memberId,
                selectionBySeatId.TryGetValue(seatId, out var userSegmentId) ? userSegmentId : null);

            if (!result.Success)
            {
                foreach (var acquiredSeatId in acquired)
                    await _seatLockService.UnlockSeatAsync(scheduleId, acquiredSeatId, ownerToken);

                throw new InvalidOperationException(result.Message ?? "Seat is locked by another user");
            }

            acquired.Add(seatId);
        }

        foreach (var seatId in releasedSeatIds)
            await _seatLockService.UnlockSeatAsync(scheduleId, seatId, ownerToken);

        foreach (var releasedId in releasedSeatIds)
        {
            await BroadcastGroupSeatLockStateAsync(scheduleId, releasedId, null, false, groupSessionId, memberId);
        }

        foreach (var newlySelectedId in newlySelectedSeatIds)
        {
            await BroadcastGroupSeatLockStateAsync(scheduleId, newlySelectedId, memberName, true, groupSessionId, memberId);
        }

        return (releasedSeatIds, newlySelectedSeatIds);
    }

    public async Task<(bool Success, string? Message)> RenewGroupMemberSelectionsAsync(
        string scheduleId,
        Guid groupSessionId,
        Guid memberId,
        TimeSpan ttl)
    {
        var ownerToken = GroupOwnerToken(groupSessionId, memberId);
        var result = await _seatLockService.RenewLocksForOwnerAsync(scheduleId, ownerToken, ttl);
        return (result.Success, result.Message);
    }

    public async Task ClearGroupSelectionsAsync(string scheduleId, Guid groupSessionId)
    {
        var locks = await _seatLockService.GetLocksForScheduleAsync(scheduleId);
        var groupLocks = locks
            .Where(l => l.OwnerType == "group-booking" && l.GroupSessionId == groupSessionId)
            .ToList();

        foreach (var lockInfo in groupLocks)
        {
            await _seatLockService.ForceUnlockSeatAsync(scheduleId, lockInfo.SeatId);
            await BroadcastGroupSeatLockStateAsync(scheduleId, lockInfo.SeatId, null, false, groupSessionId, lockInfo.MemberId);
        }
    }

    public async Task ClearGroupMemberSelectionsAsync(string scheduleId, Guid groupSessionId, Guid memberId)
    {
        var ownerToken = GroupOwnerToken(groupSessionId, memberId);
        var locks = await _seatLockService.GetLocksForOwnerAsync(scheduleId, ownerToken);

        foreach (var lockInfo in locks)
        {
            await _seatLockService.UnlockSeatAsync(scheduleId, lockInfo.SeatId, ownerToken);
            await BroadcastGroupSeatLockStateAsync(scheduleId, lockInfo.SeatId, null, false, groupSessionId, memberId);
        }
    }

    public static string GroupOwnerToken(Guid groupSessionId, Guid memberId) =>
        $"group:{groupSessionId:N}:member:{memberId:N}";

    public async Task BroadcastGroupSeatLockStateAsync(
        string scheduleId,
        string seatId,
        string? userName,
        bool isLocked,
        Guid? groupSessionId = null,
        Guid? memberId = null)
    {
        var lockedSeats = await GetCurrentLockedSeatsAsync(scheduleId);
        var eventType = isLocked ? "seat-locked" : "seat-released";

        await BroadcastEventAsync(scheduleId, eventType, new
        {
            seatId,
            userName = userName ?? "Group Member",
            lockedSeats,
            source = "group-booking",
            groupSessionId,
            memberId
        });
    }

    private Task BroadcastEventAsync(string scheduleId, string eventType, object data)
    {
        return _broadcaster.BroadcastAsync(scheduleId, eventType, new { type = eventType, data });
    }

    private async Task<bool> ForceUnlockSeatAsync(string scheduleId, string seatId)
    {
        await _seatLockService.ForceUnlockSeatAsync(scheduleId, seatId);
        return true;
    }

    private async Task<List<SeatLockInfo>> GetLocksByOwnerAcrossSchedulesAsync(string ownerToken)
    {
        var locks = await _seatLockService.GetLocksForOwnerAsync(ownerToken);
        return locks.ToList();
    }
}
