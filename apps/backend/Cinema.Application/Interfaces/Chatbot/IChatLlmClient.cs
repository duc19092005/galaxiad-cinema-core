using System.Threading.Tasks;

namespace Cinema.Application.Interfaces.Chatbot;

public record ChatGuardResult(bool IsBlocked, string Reason);

public interface IChatLlmClient
{
    Task<string> SendChatRequestAsync(string userPrompt, string toolContext, string userRole, string userId);
    Task<ChatGuardResult> CheckMessageSafetyAsync(string message);
}
