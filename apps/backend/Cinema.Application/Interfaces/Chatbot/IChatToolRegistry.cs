namespace Cinema.Application.Interfaces.Chatbot;

public interface IChatToolRegistry
{
    IChatTool? GetTool(string intent);
}
