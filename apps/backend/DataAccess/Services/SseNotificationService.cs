using BusinessLayer.Interfaces.IThirdPersonServices;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace DataAccess.Services;

public class SseNotificationService : ISseNotificationService
{
    private readonly ConcurrentDictionary<Guid, ConcurrentDictionary<Func<string, Task>, byte>> _connections = new();

    public void Subscribe(Guid userId, Func<string, Task> onMessage, Action onDisconnect)
    {
        var userConns = _connections.GetOrAdd(userId, _ => new ConcurrentDictionary<Func<string, Task>, byte>());
        userConns.TryAdd(onMessage, 1);
    }

    public void Unsubscribe(Guid userId, Func<string, Task> onMessage)
    {
        if (_connections.TryGetValue(userId, out var userConns))
        {
            userConns.TryRemove(onMessage, out _);
            if (userConns.IsEmpty)
            {
                _connections.TryRemove(userId, out _);
            }
        }
    }

    public async Task SendNotificationAsync(Guid userId, string title, string message, string type)
    {
        if (_connections.TryGetValue(userId, out var userConns))
        {
            var payload = JsonSerializer.Serialize(new
            {
                title,
                message,
                type, // ví dụ "ShiftApproved", "ShiftRejected", "ShiftCancelled", "ShiftAssigned", "PayrollProcessed"
                timestamp = DateTime.UtcNow
            });

            var tasks = userConns.Keys.Select(async onMessage =>
            {
                try
                {
                    await onMessage(payload);
                }
                catch
                {
                    // Gặp lỗi ghi thì tự động unsubscribe
                    Unsubscribe(userId, onMessage);
                }
            });

            await Task.WhenAll(tasks);
        }
    }
}
