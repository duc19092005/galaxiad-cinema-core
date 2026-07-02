using Cinema.Api.Hubs;
using Cinema.Application.Infrastructure.Booking;
using Cinema.Application.Interfaces.Booking;
using Microsoft.Extensions.Logging.Abstractions;

namespace Cinema.Tests;

public class CinemaHubTests
{
    [Fact]
    public async Task LockSeat_And_UnlockSeat_ShouldUpdateManagedState()
    {
        var broadcaster = new TestSeatBroadcaster();
        var seatLockManager = new SeatLockManager(broadcaster, new InMemorySeatLockService());
        var hub = new CinemaHub(seatLockManager, null!, NullLogger<CinemaHub>.Instance);

        var lockResult = await hub.LockSeat("schedule-1", "A1", "Alice", "client-1");

        Assert.True(lockResult.Success);
        Assert.Equal("Seat locked successfully", lockResult.Message);
        Assert.Contains("a1", lockResult.LockedSeats.Keys);

        var unlockResult = await hub.UnlockSeat("schedule-1", "A1", "client-1");

        Assert.True(unlockResult.Success);
        Assert.Empty(unlockResult.LockedSeats);
    }

    private sealed class TestSeatBroadcaster : ISeatBroadcaster
    {
        public Task BroadcastAsync(string scheduleId, string eventType, object data)
        {
            return Task.CompletedTask;
        }
    }

    private sealed class InMemorySeatLockService : ISeatLockService
    {
        private readonly Dictionary<string, SeatLockInfo> _locks = new();

        public Task<SeatLockAcquireResult> TryLockSeatAsync(
            string scheduleId,
            string seatId,
            string userName,
            string ownerToken,
            string ownerType,
            TimeSpan ttl,
            Guid? groupSessionId = null,
            Guid? memberId = null,
            Guid? userSegmentId = null)
        {
            var key = $"{scheduleId}:{seatId}".ToLowerInvariant();
            if (_locks.TryGetValue(key, out var existing) && existing.OwnerToken != ownerToken)
                return Task.FromResult(new SeatLockAcquireResult(false, "Seat is locked by another user", existing));

            var info = new SeatLockInfo(scheduleId, seatId, userName, ownerToken, ownerType, groupSessionId, memberId, userSegmentId, DateTime.UtcNow);
            _locks[key] = info;
            return Task.FromResult(new SeatLockAcquireResult(true, existing == null ? "Seat locked successfully" : "Seat already locked by you", info));
        }

        public Task<bool> UnlockSeatAsync(string scheduleId, string seatId, string ownerToken)
        {
            var key = $"{scheduleId}:{seatId}".ToLowerInvariant();
            if (!_locks.TryGetValue(key, out var existing))
                return Task.FromResult(true);

            if (existing.OwnerToken != ownerToken)
                return Task.FromResult(false);

            _locks.Remove(key);
            return Task.FromResult(true);
        }

        public Task ForceUnlockSeatAsync(string scheduleId, string seatId)
        {
            _locks.Remove($"{scheduleId}:{seatId}".ToLowerInvariant());
            return Task.CompletedTask;
        }

        public Task ReleaseSeatsByOwnerAsync(string ownerToken)
        {
            foreach (var key in _locks.Where(x => x.Value.OwnerToken == ownerToken).Select(x => x.Key).ToList())
                _locks.Remove(key);
            return Task.CompletedTask;
        }

        public Task ReleaseSeatsForScheduleAsync(string scheduleId, IEnumerable<string> seatIds)
        {
            foreach (var seatId in seatIds)
                _locks.Remove($"{scheduleId}:{seatId}".ToLowerInvariant());
            return Task.CompletedTask;
        }

        public Task<SeatLockRenewResult> RenewLocksForOwnerAsync(string scheduleId, string ownerToken, TimeSpan ttl)
        {
            var renewed = _locks.Values
                .Where(l => l.ScheduleId == scheduleId && l.OwnerToken == ownerToken)
                .ToList();
            return Task.FromResult(new SeatLockRenewResult(renewed.Count > 0, "Renewed", renewed));
        }

        public Task<IReadOnlyList<SeatLockInfo>> GetLocksForScheduleAsync(string scheduleId)
        {
            return Task.FromResult<IReadOnlyList<SeatLockInfo>>(
                _locks.Values.Where(l => l.ScheduleId == scheduleId).ToList());
        }

        public Task<IReadOnlyList<SeatLockInfo>> GetLocksForOwnerAsync(string scheduleId, string ownerToken)
        {
            return Task.FromResult<IReadOnlyList<SeatLockInfo>>(
                _locks.Values.Where(l => l.ScheduleId == scheduleId && l.OwnerToken == ownerToken).ToList());
        }

        public Task<IReadOnlyList<SeatLockInfo>> GetLocksForOwnerAsync(string ownerToken)
        {
            return Task.FromResult<IReadOnlyList<SeatLockInfo>>(
                _locks.Values.Where(l => l.OwnerToken == ownerToken).ToList());
        }
    }
}
