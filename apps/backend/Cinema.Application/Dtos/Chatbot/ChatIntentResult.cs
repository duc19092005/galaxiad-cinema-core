using System.Collections.Generic;

namespace Cinema.Application.Dtos.Chatbot;

public class ChatIntentResult
{
    public string Intent { get; set; } = string.Empty;
    public Dictionary<string, string> Parameters { get; set; } = [];
}
