using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

using System.Collections.Generic;
using Cinema.Application.Dtos.Booking;

namespace Cinema.Application.Infrastructure.Booking;

public class GroupBookingWsManager
{
    private readonly ConcurrentDictionary<Guid, ConcurrentDictionary<string, WebSocket>> _connections = new();
    private readonly ConcurrentDictionary<Guid, ConcurrentQueue<ResGroupChatMessageDto>> _chatHistories = new();

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

    public void AddConnection(Guid groupSessionId, string connectionId, WebSocket webSocket)
    {
        var groupConns = _connections.GetOrAdd(groupSessionId, _ => new());
        groupConns[connectionId] = webSocket;
    }

    public void RemoveConnection(Guid groupSessionId, string connectionId)
    {
        if (_connections.TryGetValue(groupSessionId, out var groupConns))
        {
            groupConns.TryRemove(connectionId, out _);
            if (groupConns.IsEmpty)
            {
                _connections.TryRemove(groupSessionId, out _);
            }
        }
    }

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    public async Task BroadcastAsync(Guid groupSessionId, object payload)
    {
        if (!_connections.TryGetValue(groupSessionId, out var groupConns)) return;

        var json = JsonSerializer.Serialize(payload, _jsonOptions);
        var bytes = Encoding.UTF8.GetBytes(json);
        var segment = new ArraySegment<byte>(bytes);

        var tasks = groupConns.Values
            .Where(ws => ws.State == WebSocketState.Open)
            .Select(async ws =>
            {
                try
                {
                    await ws.SendAsync(segment, WebSocketMessageType.Text, true, CancellationToken.None);
                }
                catch
                {
                    // Ignore send failures
                }
            });

        await Task.WhenAll(tasks);
    }
}
