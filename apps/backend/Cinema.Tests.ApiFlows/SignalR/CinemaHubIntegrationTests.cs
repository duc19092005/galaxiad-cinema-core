using Cinema.Api.Hubs;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Infrastructure.ExternalServices.Notifications;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Connections.Features;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace Cinema.Tests.ApiFlows.SignalR;

public class CinemaHubIntegrationTests
{
    private sealed class TestSeatBroadcaster : ISeatBroadcaster
    {
        public List<(string scheduleId, string eventType, object data)> Broadcasts { get; } = new();

        public Task BroadcastAsync(string scheduleId, string eventType, object data)
        {
            Broadcasts.Add((scheduleId, eventType, data));
            return Task.CompletedTask;
        }
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

    [Fact]
    public async Task Hub_LockSeat_ReturnsSuccessAndBroadcasts()
    {
        var broadcaster = new TestSeatBroadcaster();
        var seatLockService = new InMemorySeatLockService();
        var seatLockManager = new SeatLockManager(broadcaster, seatLockService);
        var hub = new CinemaHub(seatLockManager, null!, NullLogger<CinemaHub>.Instance);

        var result = await hub.LockSeat("schedule-1", "A1", "Alice", "client-1");

        result.Success.Should().BeTrue();
        result.LockedSeats.Should().ContainKey("a1");
        broadcaster.Broadcasts.Should().ContainSingle(b => b.scheduleId == "schedule-1" && b.eventType == "seat-locked");
    }

    [Fact]
    public async Task Hub_UnlockSeat_ReturnsSuccessAndBroadcasts()
    {
        var broadcaster = new TestSeatBroadcaster();
        var seatLockService = new InMemorySeatLockService();
        var seatLockManager = new SeatLockManager(broadcaster, seatLockService);
        var hub = new CinemaHub(seatLockManager, null!, NullLogger<CinemaHub>.Instance);

        await hub.LockSeat("schedule-1", "A1", "Alice", "client-1");
        var result = await hub.UnlockSeat("schedule-1", "A1", "client-1");

        result.Success.Should().BeTrue();
        result.LockedSeats.Should().NotContainKey("a1");
        broadcaster.Broadcasts.Should().Contain(b => b.scheduleId == "schedule-1" && b.eventType == "seat-unlocked");
    }

    [Fact]
    public async Task Hub_RenewSeatLocks_ReturnsSuccessAndCurrentState()
    {
        var broadcaster = new TestSeatBroadcaster();
        var seatLockService = new InMemorySeatLockService();
        var seatLockManager = new SeatLockManager(broadcaster, seatLockService);
        var hub = new CinemaHub(seatLockManager, null!, NullLogger<CinemaHub>.Instance);

        await hub.LockSeat("schedule-1", "B2", "Bob", "client-bob");
        var result = await hub.RenewSeatLocks("schedule-1", "client-bob");

        result.Success.Should().BeTrue();
        result.LockedSeats.Should().ContainKey("b2");
    }

    [Fact]
    public async Task Hub_OnDisconnectedAsync_SeatsGroup_ReleasesClientSeats()
    {
        var broadcaster = new TestSeatBroadcaster();
        var seatLockService = new InMemorySeatLockService();
        var seatLockManager = new SeatLockManager(broadcaster, seatLockService);

        var httpContext = new DefaultHttpContext();
        httpContext.Request.QueryString = new QueryString("?groupType=seats&clientId=client-disconnect");

        var mockContext = new Mock<HubCallerContext>();
        mockContext.Setup(c => c.ConnectionId).Returns("conn-disconnect");
        mockContext.Setup(c => c.Features.Get<IHttpContextFeature>())
            .Returns(new HttpContextFeature { HttpContext = httpContext });

        var hub = new CinemaHub(seatLockManager, null!, NullLogger<CinemaHub>.Instance)
        {
            Context = mockContext.Object
        };

        // Pre-lock a seat for this client
        await hub.LockSeat("schedule-1", "C3", "DisconnectUser", "client-disconnect");
        var locksBefore = await seatLockService.GetLocksForOwnerAsync("schedule-1", "client-disconnect");
        locksBefore.Should().HaveCount(1);

        // Act: Disconnect
        await hub.OnDisconnectedAsync(null);

        // Assert: Seats released
        var locksAfter = await seatLockService.GetLocksForOwnerAsync("schedule-1", "client-disconnect");
        locksAfter.Should().BeEmpty();
    }

    private class HttpContextFeature : IHttpContextFeature
    {
        public HttpContext? HttpContext { get; set; }
    }
}
