using System.Threading.Tasks;

namespace Cinema.Application.Interfaces.Chatbot;

public interface IChatLlmClient
{
    Task<string> SendPromptAsync(string systemPrompt, string userPrompt);
}
