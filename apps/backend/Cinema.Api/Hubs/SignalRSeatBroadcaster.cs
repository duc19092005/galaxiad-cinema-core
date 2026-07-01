using Cinema.Application.Interfaces.Booking;

namespace Cinema.Api.Hubs;

/// <summary>
/// SignalR implementation of ISeatBroadcaster.
/// Broadcasts seat lock events to all clients connected to a specific schedule.
/// </summary>
public class SignalRSeatBroadcaster : ISeatBroadcaster
{
    private readonly IHubContext<CinemaHub> _hubContext;

    public SignalRSeatBroadcaster(IHubContext<CinemaHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task BroadcastAsync(string scheduleId, string eventType, object data)
    {
        await _hubContext.Clients.Group($"seats-{scheduleId}").SendAsync(eventType, data);
    }
}
