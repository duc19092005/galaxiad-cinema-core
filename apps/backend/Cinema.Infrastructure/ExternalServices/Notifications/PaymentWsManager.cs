using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace Cinema.Application.Infrastructure.Booking;

/// <summary>
/// WebSocket-based payment status notification manager.
/// Clients connect via WS to wait for payment result after VNPay redirect.
/// </summary>
public class PaymentWsManager
{
    // orderId -> { connectionId -> WebSocket }
    private readonly ConcurrentDictionary<Guid, ConcurrentDictionary<string, WebSocket>> _connections = new();

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    public void AddConnection(Guid orderId, string connectionId, WebSocket webSocket)
    {
        var orderConns = _connections.GetOrAdd(orderId, _ => new());
        orderConns[connectionId] = webSocket;
    }

    public void RemoveConnection(Guid orderId, string connectionId)
    {
        if (_connections.TryGetValue(orderId, out var orderConns))
        {
            orderConns.TryRemove(connectionId, out _);
            if (orderConns.IsEmpty)
            {
                _connections.TryRemove(orderId, out _);
            }
        }
    }

    /// <summary>
    /// Send payment result to all connected WS clients for this orderId.
    /// Returns true if at least one client was notified.
    /// </summary>
    public bool NotifyPaymentResult(Guid orderId, PaymentStatusEvent status)
    {
        if (!_connections.TryGetValue(orderId, out var orderConns))
            return false;

        var json = JsonSerializer.Serialize(new { type = "payment-result", status }, _jsonOptions);
        var bytes = Encoding.UTF8.GetBytes(json);
        var segment = new ArraySegment<byte>(bytes);

        var notified = false;
        foreach (var ws in orderConns.Values.Where(ws => ws.State == WebSocketState.Open))
        {
            try
            {
                _ = ws.SendAsync(segment, WebSocketMessageType.Text, true, CancellationToken.None);
                notified = true;
            }
            catch
            {
                // Ignore send failures
            }
        }

        return notified;
    }
}

public class PaymentStatusEvent
{
    public Guid OrderId { get; set; }
    public string Status { get; set; } = string.Empty; // "success" | "failed" | "cancelled"
    public string Message { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public decimal? TotalPrice { get; set; }
}
