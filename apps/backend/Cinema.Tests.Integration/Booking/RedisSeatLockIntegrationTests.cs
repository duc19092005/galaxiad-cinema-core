using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Infrastructure.ExternalServices.Cache;
using Cinema.Infrastructure.ExternalServices.Notifications;
using FluentAssertions;
using Moq;
using StackExchange.Redis;
using Xunit;

namespace Cinema.Tests.Integration.Booking;

public class RedisSeatLockIntegrationTests : IDisposable
{
    private readonly IConnectionMultiplexer? _redis;
    private readonly bool _redisAvailable;
    private readonly string _testScheduleId;
    private readonly SeatLockService? _seatLockService;
    private readonly Mock<ISeatBroadcaster> _broadcasterMock;
    private readonly SeatLockManager? _seatLockManager;

    public RedisSeatLockIntegrationTests()
    {
        _testScheduleId = $"test-sched-{Guid.NewGuid():N}";
        _broadcasterMock = new Mock<ISeatBroadcaster>();

        try
        {
            var config = ConfigurationOptions.Parse("127.0.0.1:6379,abortConnect=false,connectTimeout=2000");
            _redis = ConnectionMultiplexer.Connect(config);
            _redisAvailable = _redis.IsConnected;
            if (_redisAvailable)
            {
                _seatLockService = new SeatLockService(_redis);
                _seatLockManager = new SeatLockManager(_broadcasterMock.Object, _seatLockService);
            }
        }
        catch
        {
            _redisAvailable = false;
        }
    }

    public void Dispose()
    {
        if (_redisAvailable && _redis != null && _seatLockService != null)
        {
            try
            {
                var server = _redis.GetServer(_redis.GetEndPoints().First());
                var db = _redis.GetDatabase();
                foreach (var key in server.Keys(pattern: $"*{_testScheduleId}*"))
                {
                    db.KeyDelete(key);
                }
            }
            catch
            {
                // Ignored on cleanup
            }
            _redis.Dispose();
        }
    }

    [Fact]
    public async Task TryLockSeatAsync_AcquireLock_ReturnsSuccess_SecondUserRejected()
    {
        if (!_redisAvailable) return;

        var seatId = $"seat-{Guid.NewGuid():N}";
        var ttl = TimeSpan.FromSeconds(30);

        // Act 1: User 1 locks seat
        var result1 = await _seatLockService!.TryLockSeatAsync(
            _testScheduleId,
            seatId,
            userName: "Alice",
            ownerToken: "token-alice",
            ownerType: "booking",
            ttl: ttl);

        // Assert 1: User 1 succeeds
        result1.Success.Should().BeTrue();
        result1.CurrentLock.Should().NotBeNull();
        result1.CurrentLock!.UserName.Should().Be("Alice");
        result1.CurrentLock.OwnerToken.Should().Be("token-alice");

        // Act 2: User 2 attempts to lock the same seat
        var result2 = await _seatLockService.TryLockSeatAsync(
            _testScheduleId,
            seatId,
            userName: "Bob",
            ownerToken: "token-bob",
            ownerType: "booking",
            ttl: ttl);

        // Assert 2: User 2 fails
        result2.Success.Should().BeFalse();
        result2.Message.Should().Contain("locked by another user");
        result2.CurrentLock.Should().NotBeNull();
        result2.CurrentLock!.OwnerToken.Should().Be("token-alice");

        // Act 3: User 1 refreshes lock
        var result3 = await _seatLockService.TryLockSeatAsync(
            _testScheduleId,
            seatId,
            userName: "Alice Refreshed",
            ownerToken: "token-alice",
            ownerType: "booking",
            ttl: ttl);

        // Assert 3: Refresh succeeds
        result3.Success.Should().BeTrue();
        result3.Message.Should().Contain("already locked by you");
    }

    [Fact]
    public async Task Concurrency_10ParallelLockRequests_ExactlyOneSucceeds()
    {
        if (!_redisAvailable) return;

        var seatId = $"contested-seat-{Guid.NewGuid():N}";
        const int contenderCount = 10;
        var startBarrier = new TaskCompletionSource<bool>();

        var tasks = Enumerable.Range(0, contenderCount).Select(async i =>
        {
            await startBarrier.Task; // Synchronize start
            return await _seatLockService!.TryLockSeatAsync(
                _testScheduleId,
                seatId,
                userName: $"User-{i}",
                ownerToken: $"token-{i}",
                ownerType: "booking",
                ttl: TimeSpan.FromSeconds(20));
        }).ToList();

        // Release barrier to start race condition simultaneously
        startBarrier.SetResult(true);
        var results = await Task.WhenAll(tasks);

        var successCount = results.Count(r => r.Success);
        var failureCount = results.Count(r => !r.Success);

        successCount.Should().Be(1, "exactly one client must acquire the contested seat lock");
        failureCount.Should().Be(contenderCount - 1, "all other contenders must be rejected");
    }

    [Fact]
    public async Task UnlockSeatAsync_WrongOwner_Fails_CorrectOwner_Succeeds()
    {
        if (!_redisAvailable) return;

        var seatId = $"unlock-seat-{Guid.NewGuid():N}";
        await _seatLockService!.TryLockSeatAsync(
            _testScheduleId,
            seatId,
            "OwnerUser",
            "owner-token-999",
            "booking",
            TimeSpan.FromSeconds(30));

        // Act 1: Wrong user attempts to unlock
        var wrongUnlock = await _seatLockService.UnlockSeatAsync(_testScheduleId, seatId, "wrong-token-000");

        // Assert 1: Rejection
        wrongUnlock.Should().BeFalse();

        // Verify still locked
        var locks = await _seatLockService.GetLocksForScheduleAsync(_testScheduleId);
        locks.Should().Contain(l => l.SeatId == seatId.ToLowerInvariant());

        // Act 2: Owner unlocks
        var ownerUnlock = await _seatLockService.UnlockSeatAsync(_testScheduleId, seatId, "owner-token-999");

        // Assert 2: Success
        ownerUnlock.Should().BeTrue();
        var locksAfter = await _seatLockService.GetLocksForScheduleAsync(_testScheduleId);
        locksAfter.Should().NotContain(l => l.SeatId == seatId.ToLowerInvariant());
    }

    [Fact]
    public async Task UpdateGroupMemberSelectionAsync_RollsBackOnPartialFailure()
    {
        if (!_redisAvailable) return;

        var groupSessionId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        var otherMemberId = Guid.NewGuid();

        var seat1 = Guid.NewGuid();
        var seat2 = Guid.NewGuid(); // Will be pre-locked by another user
        var seat3 = Guid.NewGuid();

        // Pre-lock seat2 with a different member
        var otherOwnerToken = SeatLockManager.GroupOwnerToken(groupSessionId, otherMemberId);
        await _seatLockService!.TryLockSeatAsync(
            _testScheduleId,
            seat2.ToString(),
            "OtherMember",
            otherOwnerToken,
            "group-booking",
            TimeSpan.FromMinutes(5),
            groupSessionId,
            otherMemberId);

        var selections = new List<GroupSeatSelectionDto>
        {
            new() { SeatId = seat1, UserSegmentId = Guid.NewGuid() },
            new() { SeatId = seat2, UserSegmentId = Guid.NewGuid() },
            new() { SeatId = seat3, UserSegmentId = Guid.NewGuid() }
        };

        // Act: Attempt to lock batch [seat1, seat2, seat3]. seat2 will fail!
        var act = async () => await _seatLockManager!.UpdateGroupMemberSelectionAsync(
            _testScheduleId,
            groupSessionId,
            memberId,
            "MemberAlice",
            selections,
            TimeSpan.FromMinutes(5));

        // Assert: Should throw and roll back seat1
        await act.Should().ThrowAsync<InvalidOperationException>();

        var memberOwnerToken = SeatLockManager.GroupOwnerToken(groupSessionId, memberId);
        var memberLocks = await _seatLockService.GetLocksForOwnerAsync(_testScheduleId, memberOwnerToken);

        // Neither seat1 nor seat3 should remain locked by memberAlice!
        memberLocks.Should().BeEmpty("all successfully locked seats before failure must be cleanly rolled back");
    }

    [Fact]
    public async Task ReleaseSeatsByClientAsync_ReleasesAllSeatsAcrossSchedules()
    {
        if (!_redisAvailable) return;

        var clientId = $"client-{Guid.NewGuid():N}";
        var seatA = $"seat-a-{Guid.NewGuid():N}";
        var seatB = $"seat-b-{Guid.NewGuid():N}";

        await _seatLockManager!.LockSeatAsync(_testScheduleId, seatA, "ClientUser", clientId);
        await _seatLockManager.LockSeatAsync(_testScheduleId, seatB, "ClientUser", clientId);

        var lockedBefore = await _seatLockManager.GetCurrentLockedSeatsAsync(_testScheduleId);
        lockedBefore.Should().ContainKey(seatA.ToLowerInvariant());
        lockedBefore.Should().ContainKey(seatB.ToLowerInvariant());

        // Act
        await _seatLockManager.ReleaseSeatsByClientAsync(clientId);

        // Assert
        var lockedAfter = await _seatLockManager.GetCurrentLockedSeatsAsync(_testScheduleId);
        lockedAfter.Should().NotContainKey(seatA.ToLowerInvariant());
        lockedAfter.Should().NotContainKey(seatB.ToLowerInvariant());
    }
}
