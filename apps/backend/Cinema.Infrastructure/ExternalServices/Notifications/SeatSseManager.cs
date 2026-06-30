using System.Collections.Concurrent;
using System.Text.Json;

namespace Cinema.Application.Infrastructure.Booking;

/// <summary>
/// Singleton quản lý seat lock state + SSE subscribers cho mỗi schedule.
/// Thay thế SignalR SeatHub với SSE + HTTP POST.
/// </summary>
public class SeatSseManager
{
    // scheduleId -> { seatId -> (userName, clientId) }
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, (string UserName, string ClientId)>> _scheduleSeatLocks = new();

    // scheduleId -> { subscriberId -> callback(data, eventId) }
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, Func<string, int, Task>>> _scheduleSubscribers = new();

    // scheduleId -> nextEventId
    private readonly ConcurrentDictionary<string, int> _scheduleEventCounters = new();

    /// <summary>
    /// Lock một seat. Trả về false nếu seat đã bị user khác lock.
    /// Idempotent: nếu chính user đó lock lại seat, trả về true.
    /// </summary>
    public (bool Success, string? Message, Dictionary<string, string> LockedSeats) LockSeat(
        string scheduleId, string seatId, string userName, string clientId)
    {
        var seats = _scheduleSeatLocks.GetOrAdd(scheduleId, _ => new ConcurrentDictionary<string, (string, string)>());

        // Check if seat is already locked by someone else
        if (seats.TryGetValue(seatId, out var existing))
        {
            if (existing.ClientId == clientId)
            {
                // Idempotent: same client re-locking = success
                return (true, "Seat already locked by you", GetCurrentLockedSeats(scheduleId));
            }
            return (false, "Seat is locked by another user", GetCurrentLockedSeats(scheduleId));
        }

        // Atomic add: TryAdd returns false if another thread added first
        if (!seats.TryAdd(seatId, (userName, clientId)))
        {
            // Race condition: another thread locked it between our TryGetValue and TryAdd
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

        // If clientId is provided, verify ownership (skip for background job calls with null clientId)
        if (clientId != null && removed.ClientId != clientId)
        {
            // Put it back
            seats.TryAdd(seatId, removed);
            return (false, "Cannot unlock seat locked by another user", GetCurrentLockedSeats(scheduleId));
        }

        var lockedSeats = GetCurrentLockedSeats(scheduleId);
        BroadcastEvent(scheduleId, "seat-unlocked", new { seatId, lockedSeats });
        return (true, "Seat unlocked successfully", lockedSeats);
    }

    /// <summary>
    /// Giải phóng tất cả seats do một client lock (gọi khi SSE connection drop).
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
    /// Đăng ký một SSE subscriber. Trả về snapshot lockedSeats hiện tại.
    /// </summary>
    public Dictionary<string, string> Subscribe(string scheduleId, string subscriberId, Func<string, int, Task> callback)
    {
        var subscribers = _scheduleSubscribers.GetOrAdd(scheduleId, _ => new ConcurrentDictionary<string, Func<string, int, Task>>());
        subscribers.TryAdd(subscriberId, callback);
        return GetCurrentLockedSeats(scheduleId);
    }

    /// <summary>
    /// Hủy đăng ký SSE subscriber.
    /// </summary>
    public void Unsubscribe(string scheduleId, string subscriberId)
    {
        if (_scheduleSubscribers.TryGetValue(scheduleId, out var subscribers))
        {
            subscribers.TryRemove(subscriberId, out _);
            if (subscribers.IsEmpty)
            {
                _scheduleSubscribers.TryRemove(scheduleId, out _);
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

    private int GetNextEventId(string scheduleId)
    {
        return _scheduleEventCounters.AddOrUpdate(scheduleId, 1, (_, current) => current + 1);
    }

    private void BroadcastEvent(string scheduleId, string eventType, object data)
    {
        if (!_scheduleSubscribers.TryGetValue(scheduleId, out var subscribers))
            return;

        var eventId = GetNextEventId(scheduleId);
        var payload = JsonSerializer.Serialize(data);

        foreach (var subscriber in subscribers)
        {
            try
            {
                _ = subscriber.Value(payload, eventId);
            }
            catch
            {
                // Subscriber failed, will be cleaned up by the SSE endpoint
            }
        }
    }
}
