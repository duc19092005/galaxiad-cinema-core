using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Cinema.Application.Infrastructure.Booking;

public class SeatWsManager
{
    // scheduleId -> { connectionId -> WebSocket }
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, WebSocket>> _connections = new();

    public void AddConnection(string scheduleId, string connectionId, WebSocket webSocket)
    {
        var groupConns = _connections.GetOrAdd(scheduleId, _ => new());
        groupConns[connectionId] = webSocket;
    }

    public void RemoveConnection(string scheduleId, string connectionId)
    {
        if (_connections.TryGetValue(scheduleId, out var groupConns))
        {
            groupConns.TryRemove(connectionId, out _);
            if (groupConns.IsEmpty)
            {
                _connections.TryRemove(scheduleId, out _);
            }
        }
    }

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    public async Task BroadcastAsync(string scheduleId, object payload)
    {
        if (!_connections.TryGetValue(scheduleId, out var groupConns)) return;

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
