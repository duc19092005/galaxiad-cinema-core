using System.Threading.Tasks;
using Cinema.Application.Dtos.Chatbot;

namespace Cinema.Application.Interfaces.Chatbot;

public interface IChatIntentClassifier
{
    Task<ChatIntentResult> ClassifyIntentAsync(string message);
}
