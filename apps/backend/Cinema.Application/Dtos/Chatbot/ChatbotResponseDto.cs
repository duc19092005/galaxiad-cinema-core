using System.Collections.Generic;
using System.Text.Json;

namespace Cinema.Application.Dtos.Chatbot;

public class ChatbotResponseDto
{
    public string Response { get; set; } = string.Empty;
    public string Intent { get; set; } = string.Empty;
    public bool IsAuthorized { get; set; } = true;
    public List<ReferencedMovieDto> ReferencedMovies { get; set; } = [];
    public List<ReferencedScheduleDto> ReferencedSchedules { get; set; } = [];
    public List<ChatbotUiActionDto> UiActions { get; set; } = [];
    public JsonElement? BookingState { get; set; }
    public string? OrderId { get; set; }
}

public class ChatbotUiActionDto
{
    public string ActionId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public List<ChatbotUiOptionDto> Options { get; set; } = [];
    public JsonElement? Payload { get; set; }
}

public class ChatbotUiOptionDto
{
    public string Label { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public JsonElement? Payload { get; set; }
}

public class ReferencedMovieDto
{
    public string MovieId { get; set; } = string.Empty;
    public string MovieName { get; set; } = string.Empty;
}

public class ReferencedScheduleDto
{
    public string ScheduleId { get; set; } = string.Empty;
    public string MovieId { get; set; } = string.Empty;
    public string MovieName { get; set; } = string.Empty;
    public string ShowTime { get; set; } = string.Empty;
    public string CinemaName { get; set; } = string.Empty;
    public string FormatName { get; set; } = string.Empty;
    public double? CinemaLatitude { get; set; }
    public double? CinemaLongitude { get; set; }
}

