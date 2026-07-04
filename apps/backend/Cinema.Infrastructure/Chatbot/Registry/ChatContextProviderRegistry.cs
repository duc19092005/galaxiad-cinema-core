using System;
using System.Collections.Generic;
using System.Linq;
using Cinema.Application.Interfaces.Chatbot;

namespace Cinema.Infrastructure.Chatbot.Registry;

public class ChatContextProviderRegistry : IChatContextProviderRegistry
{
    private readonly Dictionary<string, IChatContextProvider> _providers;

    public ChatContextProviderRegistry(IEnumerable<IChatContextProvider> providers)
    {
        _providers = providers.ToDictionary(provider => provider.IntentName, StringComparer.OrdinalIgnoreCase);
    }

    public IChatContextProvider? GetProvider(string intent)
    {
        return _providers.TryGetValue(intent, out var provider) ? provider : null;
    }
}
