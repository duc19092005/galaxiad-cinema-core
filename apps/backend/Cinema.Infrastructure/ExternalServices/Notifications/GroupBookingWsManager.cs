using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

using System.Collections.Generic;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;

namespace Cinema.Application.Infrastructure.Booking;

/// <summary>
/// Manages group booking chat history and broadcasts events via SignalR.
/// Connection management is handled by CinemaHub (SignalR).
/// </summary>
public class GroupBookingWsManager
{
    private readonly IGroupBroadcaster _broadcaster;
    private readonly ConcurrentDictionary<Guid, ConcurrentQueue<ResGroupChatMessageDto>> _chatHistories = new();

    public GroupBookingWsManager(IGroupBroadcaster broadcaster)
    {
        _broadcaster = broadcaster;
    }

    public void AddChatMessage(Guid groupSessionId, ResGroupChatMessageDto message)
    {
        var queue = _chatHistories.GetOrAdd(groupSessionId, _ => new());
        queue.Enqueue(message);

        // Keep last 100 messages to prevent memory leak
        while (queue.Count > 100)
        {
            queue.TryDequeue(out _);
        }
    }

    public List<ResGroupChatMessageDto> GetChatMessages(Guid groupSessionId)
    {
        if (_chatHistories.TryGetValue(groupSessionId, out var queue))
        {
            return queue.ToList();
        }
        return new List<ResGroupChatMessageDto>();
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
