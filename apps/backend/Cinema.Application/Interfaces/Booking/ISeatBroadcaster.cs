namespace Cinema.Application.Interfaces.Booking;

/// <summary>
/// Abstraction for broadcasting seat lock events to connected clients.
/// Implemented by API layer using SignalR.
/// </summary>
public interface ISeatBroadcaster
{
    Task BroadcastAsync(string scheduleId, string eventType, object data);
}
