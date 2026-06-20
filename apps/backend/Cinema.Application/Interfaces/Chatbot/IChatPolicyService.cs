using System.Threading.Tasks;

namespace Cinema.Application.Interfaces.Chatbot;

public interface IChatPolicyService
{
    Task<bool> IsAuthorizedAsync(string intent);
}
