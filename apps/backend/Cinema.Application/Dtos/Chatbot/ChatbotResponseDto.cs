using System.Collections.Generic;

namespace Cinema.Application.Dtos.Chatbot;

public class ChatbotResponseDto
{
    public string Response { get; set; } = string.Empty;
    public string Intent { get; set; } = string.Empty;
    public bool IsAuthorized { get; set; } = true;
    public List<ReferencedMovieDto> ReferencedMovies { get; set; } = [];
    public List<ReferencedScheduleDto> ReferencedSchedules { get; set; } = [];
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
}

