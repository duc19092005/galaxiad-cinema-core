using System.Collections.Concurrent;
using System.Text.Json;
using Cinema.Application.Interfaces.Booking;

namespace Cinema.Application.Infrastructure.Booking;

/// <summary>
/// Manages seat lock state per schedule and broadcasts events via SignalR.
/// </summary>
public class SeatLockManager
{
    // scheduleId -> { seatId -> (userName, clientId) }
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, (string UserName, string ClientId)>> _scheduleSeatLocks = new();

    // scheduleId -> { seatId -> (groupSessionId, memberId, memberName) }
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, (Guid GroupSessionId, Guid MemberId, string MemberName)>> _groupSeatSelections = new();

    private readonly ISeatBroadcaster _broadcaster;

    public SeatLockManager(ISeatBroadcaster broadcaster)
    {
        _broadcaster = broadcaster;
    }

    /// <summary>
    /// Lock một seat. Trả về false nếu seat đã bị user khác lock.
    /// Idempotent: nếu chính user đó lock lại seat, trả về true.
    /// </summary>
    public (bool Success, string? Message, Dictionary<string, string> LockedSeats) LockSeat(
        string scheduleId, string seatId, string userName, string clientId)
    {
        var seats = _scheduleSeatLocks.GetOrAdd(scheduleId, _ => new ConcurrentDictionary<string, (string, string)>());

        if (seats.TryGetValue(seatId, out var existing))
        {
            if (existing.ClientId == clientId)
            {
                return (true, "Seat already locked by you", GetCurrentLockedSeats(scheduleId));
            }
            return (false, "Seat is locked by another user", GetCurrentLockedSeats(scheduleId));
        }

        if (!seats.TryAdd(seatId, (userName, clientId)))
        {
            seats.TryGetValue(seatId, out existing);
            if (existing.ClientId == clientId)
                return (true, "Seat already locked by you", GetCurrentLockedSeats(scheduleId));
            return (false, "Seat is locked by another user", GetCurrentLockedSeats(scheduleId));
        }

        var lockedSeats = GetCurrentLockedSeats(scheduleId);
        BroadcastEvent(scheduleId, "seat-locked", new { seatId, userName, lockedSeats });
        return (true, "Seat locked successfully", lockedSeats);
    }

    /// <summary>
    /// Unlock một seat. Chỉ unlock được nếu clientId khớp hoặc là background job call.
    /// </summary>
    public (bool Success, string? Message, Dictionary<string, string> LockedSeats) UnlockSeat(
        string scheduleId, string seatId, string? clientId = null)
    {
        if (!_scheduleSeatLocks.TryGetValue(scheduleId, out var seats))
        {
            return (true, "No locks found", new Dictionary<string, string>());
        }

        if (!seats.TryRemove(seatId, out var removed))
        {
            return (true, "Seat was not locked", GetCurrentLockedSeats(scheduleId));
        }

        if (clientId != null && removed.ClientId != clientId)
        {
            seats.TryAdd(seatId, removed);
            return (false, "Cannot unlock seat locked by another user", GetCurrentLockedSeats(scheduleId));
        }

        var lockedSeats = GetCurrentLockedSeats(scheduleId);
        BroadcastEvent(scheduleId, "seat-unlocked", new { seatId, lockedSeats });
        return (true, "Seat unlocked successfully", lockedSeats);
    }

    /// <summary>
    /// Giải phóng tất cả seats do một client lock.
    /// </summary>
    public void ReleaseSeatsByClient(string clientId)
    {
        foreach (var schedulePair in _scheduleSeatLocks)
        {
            var scheduleId = schedulePair.Key;
            var seats = schedulePair.Value;

            var seatsToRemove = seats
                .Where(s => s.Value.ClientId == clientId)
                .Select(s => s.Key)
                .ToList();

            foreach (var seatId in seatsToRemove)
            {
                if (seats.TryRemove(seatId, out _))
                {
                    var lockedSeats = GetCurrentLockedSeats(scheduleId);
                    BroadcastEvent(scheduleId, "seat-unlocked", new { seatId, lockedSeats });
                }
            }
        }
    }

    /// <summary>
    /// Giải phóng cụ thể các seats (gọi từ PendingOrderCancellationJob).
    /// </summary>
    public void ReleaseSeatsForSchedule(string scheduleId, List<string> seatIds)
    {
        if (!_scheduleSeatLocks.TryGetValue(scheduleId, out var seats))
            return;

        foreach (var seatId in seatIds)
        {
            if (seats.TryRemove(seatId, out _))
            {
                var lockedSeats = GetCurrentLockedSeats(scheduleId);
                BroadcastEvent(scheduleId, "seat-unlocked", new { seatId, lockedSeats });
            }
        }
    }

    /// <summary>
    /// Lấy danh sách seats đang bị lock của một schedule.
    /// </summary>
    public Dictionary<string, string> GetCurrentLockedSeats(string scheduleId)
    {
        if (!_scheduleSeatLocks.TryGetValue(scheduleId, out var seats))
            return new Dictionary<string, string>();

        return seats.ToDictionary(k => k.Key, v => v.Value.UserName);
    }

    /// <summary>
    /// Broadcast trạng thái ghế đặt từ Group Booking sang những khách hàng đặt lẻ.
    /// </summary>
    public void BroadcastGroupSeatLockState(
        string scheduleId,
        string seatId,
        string? userName,
        bool isLocked,
        Guid? groupSessionId = null,
        Guid? memberId = null)
    {
        var lockedSeats = GetCurrentLockedSeats(scheduleId);
        var eventType = isLocked ? "seat-locked" : "seat-released";

        if (isLocked)
        {
            BroadcastEvent(scheduleId, eventType, new
            {
                seatId,
                userName = userName ?? "Group Member",
                lockedSeats,
                source = "group-booking",
                groupSessionId,
                memberId
            });
        }
        else
        {
            BroadcastEvent(scheduleId, eventType, new
            {
                seatId,
                lockedSeats,
                source = "group-booking",
                groupSessionId,
                memberId
            });
        }
    }

    private void BroadcastEvent(string scheduleId, string eventType, object data)
    {
        _ = _broadcaster.BroadcastAsync(scheduleId, eventType, new { type = eventType, data });
    }

    public Dictionary<string, (Guid GroupSessionId, Guid MemberId, string MemberName)> GetGroupSelectionsForSchedule(string scheduleId)
    {
        if (!_groupSeatSelections.TryGetValue(scheduleId, out var selections))
            return new Dictionary<string, (Guid, Guid, string)>();

        return selections.ToDictionary(k => k.Key, v => v.Value);
    }

    public List<string> GetGroupSelectedSeats(string scheduleId, Guid groupSessionId)
    {
        if (!_groupSeatSelections.TryGetValue(scheduleId, out var selections))
            return new List<string>();

        return selections.Where(s => s.Value.GroupSessionId == groupSessionId).Select(s => s.Key).ToList();
    }

    public (List<string> ReleasedSeatIds, List<string> NewlySelectedSeatIds) UpdateGroupMemberSelection(
        string scheduleId, Guid groupSessionId, Guid memberId, string memberName, List<string> seatIds)
    {
        var selections = _groupSeatSelections.GetOrAdd(scheduleId, _ => new());

        var existingSeats = selections
            .Where(s => s.Value.MemberId == memberId)
            .Select(s => s.Key)
            .ToList();

        var releasedSeatIds = existingSeats.Except(seatIds).ToList();
        var newlySelectedSeatIds = seatIds.Except(existingSeats).ToList();

        foreach (var seatId in releasedSeatIds)
        {
            selections.TryRemove(seatId, out _);
        }

        foreach (var seatId in newlySelectedSeatIds)
        {
            selections[seatId] = (groupSessionId, memberId, memberName);
        }

        foreach (var releasedId in releasedSeatIds)
        {
            BroadcastGroupSeatLockState(scheduleId, releasedId, null, false, groupSessionId, memberId);
        }

        foreach (var newlySelectedId in newlySelectedSeatIds)
        {
            BroadcastGroupSeatLockState(scheduleId, newlySelectedId, memberName, true, groupSessionId, memberId);
        }

        return (releasedSeatIds, newlySelectedSeatIds);
    }

    public void ClearGroupSelections(string scheduleId, Guid groupSessionId)
    {
        if (!_groupSeatSelections.TryGetValue(scheduleId, out var selections)) return;

        var seatsToRemove = selections
            .Where(s => s.Value.GroupSessionId == groupSessionId)
            .Select(s => s.Key)
            .ToList();

        foreach (var seatId in seatsToRemove)
        {
            if (selections.TryRemove(seatId, out var removedSelection))
            {
                BroadcastGroupSeatLockState(scheduleId, seatId, null, false, groupSessionId, removedSelection.MemberId);
            }
        }
    }

    public void ClearGroupMemberSelections(string scheduleId, Guid groupSessionId, Guid memberId)
    {
        if (!_groupSeatSelections.TryGetValue(scheduleId, out var selections)) return;

        var seatsToRemove = selections
            .Where(s => s.Value.MemberId == memberId)
            .Select(s => s.Key)
            .ToList();

        foreach (var seatId in seatsToRemove)
        {
            if (selections.TryRemove(seatId, out _))
            {
                BroadcastGroupSeatLockState(scheduleId, seatId, null, false, groupSessionId, memberId);
            }
        }
    }
}
