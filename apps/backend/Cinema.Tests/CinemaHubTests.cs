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
        var seatLockManager = new SeatLockManager(broadcaster);
        var hub = new CinemaHub(seatLockManager, null!, NullLogger<CinemaHub>.Instance);

        var lockResult = await hub.LockSeat("schedule-1", "A1", "Alice", "client-1");

        Assert.True(lockResult.Success);
        Assert.Equal("Seat locked successfully", lockResult.Message);
        Assert.Contains("A1", lockResult.LockedSeats.Keys);

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
}
