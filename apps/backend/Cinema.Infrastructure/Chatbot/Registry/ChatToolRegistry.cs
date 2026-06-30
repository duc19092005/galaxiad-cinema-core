using System;
using System.Collections.Generic;
using System.Linq;
using Cinema.Application.Interfaces.Chatbot;

namespace Cinema.Infrastructure.Chatbot.Registry;

public class ChatToolRegistry : IChatToolRegistry
{
    private readonly Dictionary<string, IChatTool> _tools;

    public ChatToolRegistry(IEnumerable<IChatTool> tools)
    {
        _tools = tools.ToDictionary(t => t.IntentName, StringComparer.OrdinalIgnoreCase);
    }

    public IChatTool? GetTool(string intent)
    {
        return _tools.TryGetValue(intent, out var tool) ? tool : null;
    }
}

