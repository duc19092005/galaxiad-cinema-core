using System.Threading.Tasks;

namespace Cinema.Application.Interfaces.Chatbot;

public interface IChatLlmClient
{
    Task<string> SendChatRequestAsync(string userPrompt, string toolContext, string userRole, string userId);
}
