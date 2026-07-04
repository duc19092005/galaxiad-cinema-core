namespace Cinema.Application.Interfaces.Chatbot;

public interface IChatContextProviderRegistry
{
    IChatContextProvider? GetProvider(string intent);
}
