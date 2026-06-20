using System.Collections.Generic;
using System.Threading.Tasks;

namespace Cinema.Application.Interfaces.Chatbot;

public interface IChatTool
{
    string IntentName { get; }
    Task<string> ExecuteAsync(Dictionary<string, string> parameters);
}
