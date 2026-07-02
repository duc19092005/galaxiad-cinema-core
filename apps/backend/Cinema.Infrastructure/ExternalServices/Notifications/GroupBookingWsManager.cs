using System;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.Booking;

namespace Cinema.Application.Infrastructure.Booking;

/// <summary>
/// Manages group booking chat history and broadcasts events via SignalR.
/// Connection management is handled by CinemaHub (SignalR).
/// </summary>
public class GroupBookingWsManager
{
    private readonly IGroupBroadcaster _broadcaster;

    public GroupBookingWsManager(IGroupBroadcaster broadcaster)
    {
        _broadcaster = broadcaster;
    }

    /// <summary>
    /// Broadcast a payload to all clients in a group.
    /// The payload must include a "type" field (e.g. "group-update", "chat-message").
    /// This method extracts the type and uses it as the SignalR method name.
    /// </summary>
    public async Task BroadcastAsync(Guid groupSessionId, object payload)
    {
        // Extract "type" field from anonymous object using reflection/serialization
        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
        });

        var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var eventType = root.TryGetProperty("type", out var typeProp)
            ? typeProp.GetString() ?? "message"
            : "message";

        // Send via SignalR: Clients.Group().SendAsync(eventType, payload)
        await _broadcaster.BroadcastAsync(groupSessionId, eventType, root);
    }
}
