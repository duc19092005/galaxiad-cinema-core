using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Cinema.Application.Interfaces.Chatbot;

public record ChatGuardResult(bool IsBlocked, string Reason);

public interface IChatLlmClient
{
    Task<string> SendChatRequestAsync(string userPrompt, string supportingContext, string userRole, string userId, string sessionId = "");
    IAsyncEnumerable<string> StreamChatRequestAsync(string userPrompt, string supportingContext, string userRole, string userId, string sessionId = "", CancellationToken cancellationToken = default);

    Task<ChatGuardResult> CheckMessageSafetyAsync(string message);
}
