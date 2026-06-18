using System;
using System.Threading.Tasks;

namespace BusinessLayer.Interfaces.IThirdPersonServices;

public interface ISseNotificationService
{
    void Subscribe(Guid userId, Func<string, Task> onMessage, Action onDisconnect);
    void Unsubscribe(Guid userId, Func<string, Task> onMessage);
    Task SendNotificationAsync(Guid userId, string title, string message, string type);
}
