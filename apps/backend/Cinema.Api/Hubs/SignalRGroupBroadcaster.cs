using Cinema.Application.Interfaces.Booking;

namespace Cinema.Api.Hubs;

/// <summary>
/// SignalR implementation of IGroupBroadcaster.
/// Broadcasts group booking events to all clients connected to a specific group session.
/// </summary>
public class SignalRGroupBroadcaster : IGroupBroadcaster
{
    private readonly IHubContext<CinemaHub> _hubContext;

    public SignalRGroupBroadcaster(IHubContext<CinemaHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task BroadcastAsync(Guid groupSessionId, string eventType, object data)
    {
        await _hubContext.Clients.Group($"group-{groupSessionId}").SendAsync(eventType, data);
    }
}
