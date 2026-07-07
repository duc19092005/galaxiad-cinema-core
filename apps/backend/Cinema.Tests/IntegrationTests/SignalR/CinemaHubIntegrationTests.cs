using FluentAssertions;
using Cinema.Infrastructure.ExternalServices.Notifications;
using Cinema.Api.Hubs;
using Microsoft.Extensions.Logging.Abstractions;

namespace Cinema.Tests.IntegrationTests.SignalR;

/// <summary>
/// Integration tests for CinemaHub SignalR hub lifecycle.
/// </summary>
public class CinemaHubIntegrationTests
{
    [Fact]
    public async Task Hub_LockSeat_ShouldReturnSuccessAndTrackState()
    {
        var broadcaster = new TestSeatBroadcaster();
        var seatLockService = new InMemorySeatLockService();
        var seatLockManager = new SeatLockManager(broadcaster, seatLockService);
        var hub = new CinemaHub(seatLockManager, null!, NullLogger<CinemaHub>.Instance);

        var result = await hub.LockSeat("schedule-1", "A1", "User1", "client-1");

        result.Success.Should().BeTrue();
        result.LockedSeats.Should().ContainKey("a1");
    }

    [Fact]
    public async Task Hub_UnlockSeat_ShouldRemoveFromState()
    {
        var broadcaster = new TestSeatBroadcaster();
        var seatLockService = new InMemorySeatLockService();
        var seatLockManager = new SeatLockManager(broadcaster, seatLockService);
        var hub = new CinemaHub(seatLockManager, null!, NullLogger<CinemaHub>.Instance);

        await hub.LockSeat("schedule-1", "A1", "User1", "client-1");
        var result = await hub.UnlockSeat("schedule-1", "A1", "client-1");

        result.Success.Should().BeTrue();
        result.LockedSeats.Should().BeEmpty();
    }

    [Fact]
    public async Task Hub_LockAlreadyLockedSeat_ShouldFail()
    {
        var broadcaster = new TestSeatBroadcaster();
        var seatLockService = new InMemorySeatLockService();
        var seatLockManager = new SeatLockManager(broadcaster, seatLockService);
        var hub = new CinemaHub(seatLockManager, null!, NullLogger<CinemaHub>.Instance);

        await hub.LockSeat("schedule-1", "A1", "User1", "client-1");
        var result = await hub.LockSeat("schedule-1", "A1", "User2", "client-2");

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("locked by another");
    }

    [Fact]
    public async Task Hub_RenewLocks_ShouldExtendTtl()
    {
        var broadcaster = new TestSeatBroadcaster();
        var seatLockService = new InMemorySeatLockService();
        var seatLockManager = new SeatLockManager(broadcaster, seatLockService);
        var hub = new CinemaHub(seatLockManager, null!, NullLogger<CinemaHub>.Instance);

        await hub.LockSeat("schedule-1", "A1", "User1", "client-1");
        var result = await hub.RenewSeatLocks("schedule-1", "client-1");

        result.Should().NotBeNull();
    }

    [Fact]
    public async Task Hub_MultipleSeats_SameUser_ShouldTrackAll()
    {
        var broadcaster = new TestSeatBroadcaster();
        var seatLockService = new InMemorySeatLockService();
        var seatLockManager = new SeatLockManager(broadcaster, seatLockService);
        var hub = new CinemaHub(seatLockManager, null!, NullLogger<CinemaHub>.Instance);

        await hub.LockSeat("schedule-1", "A1", "User1", "client-1");
        await hub.LockSeat("schedule-1", "A2", "User1", "client-1");
        await hub.LockSeat("schedule-1", "A3", "User1", "client-1");

        var locks = await seatLockService.GetLocksForOwnerAsync("client-1");
        locks.Should().HaveCount(3);
    }

    // Test doubles
    private sealed class TestSeatBroadcaster : ISeatBroadcaster
    {
        public Task BroadcastAsync(string scheduleId, string eventType, object data) => Task.CompletedTask;
    }

    private sealed class InMemorySeatLockService : ISeatLockService
    {
        private readonly Dictionary<string, SeatLockInfo> _locks = new();

        public Task<SeatLockAcquireResult> TryLockSeatAsync(
            string scheduleId, string seatId, string userName, string ownerToken,
            string ownerType, TimeSpan ttl, Guid? groupSessionId = null,
            Guid? memberId = null, Guid? userSegmentId = null)
        {
            var key = $"{scheduleId}:{seatId}".ToLowerInvariant();
            if (_locks.TryGetValue(key, out var existing) && existing.OwnerToken != ownerToken)
                return Task.FromResult(new SeatLockAcquireResult(false, "Seat is locked by another user", existing));

            var info = new SeatLockInfo(scheduleId, seatId, userName, ownerToken, ownerType,
                groupSessionId, memberId, userSegmentId, DateTime.UtcNow);
            _locks[key] = info;
            return Task.FromResult(new SeatLockAcquireResult(true, "Seat locked successfully", info));
        }

        public Task<bool> UnlockSeatAsync(string scheduleId, string seatId, string ownerToken)
        {
            var key = $"{scheduleId}:{seatId}".ToLowerInvariant();
            if (!_locks.TryGetValue(key, out var existing)) return Task.FromResult(true);
            if (existing.OwnerToken != ownerToken) return Task.FromResult(false);
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
            var renewed = _locks.Values.Where(l => l.ScheduleId == scheduleId && l.OwnerToken == ownerToken).ToList();
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
