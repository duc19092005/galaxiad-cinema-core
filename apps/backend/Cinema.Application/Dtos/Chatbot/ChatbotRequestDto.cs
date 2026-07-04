namespace Cinema.Application.Dtos.Chatbot;

public class ChatbotRequestDto
{
    public string Message { get; set; } = string.Empty;
    public string? SessionId { get; set; }

}
