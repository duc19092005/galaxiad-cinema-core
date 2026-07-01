namespace Cinema.Application.Interfaces.Booking;

/// <summary>
/// Abstraction for broadcasting group booking events to connected clients.
/// Implemented by API layer using SignalR.
/// </summary>
public interface IGroupBroadcaster
{
    /// <summary>
    /// Broadcast a typed event to all clients in a group.
    /// The eventType becomes the SignalR method name on the client.
    /// </summary>
    Task BroadcastAsync(Guid groupSessionId, string eventType, object data);
}
