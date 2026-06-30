using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Cinema.Application.Interfaces.Chatbot;

public record ChatGuardResult(bool IsBlocked, string Reason);

public interface IChatLlmClient
{
    Task<string> SendChatRequestAsync(string userPrompt, string toolContext, string userRole, string userId);
    IAsyncEnumerable<string> StreamChatRequestAsync(string userPrompt, string toolContext, string userRole, string userId, CancellationToken cancellationToken = default);
    Task<ChatGuardResult> CheckMessageSafetyAsync(string message);
}
