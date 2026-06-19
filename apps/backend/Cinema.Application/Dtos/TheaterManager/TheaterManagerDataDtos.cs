using System;
using System.Collections.Generic;

namespace Cinema.Application.Dtos.TheaterManager;

public class TheaterManagerMovieOptionDto
{
    public Guid MovieId { get; set; }
    public string MovieName { get; set; } = string.Empty;
    public Guid FormatId { get; set; }
    public string FormatName { get; set; } = string.Empty;
}

public class TheaterManagerAuditoriumFormatOptionDto
{
    public Guid FormatId { get; set; }
    public string FormatName { get; set; } = string.Empty;
}

public class TheaterManagerAuditoriumOptionDto
{
    public Guid AuditoriumId { get; set; }
    public string AuditoriumNumber { get; set; } = string.Empty;
    public int TotalSeats { get; set; }
    public List<TheaterManagerAuditoriumFormatOptionDto> Formats { get; set; } = [];
}

public class TheaterManagerAuditoriumSelectionDto
{
    public string CinemaName { get; set; } = string.Empty;
    public List<TheaterManagerAuditoriumOptionDto> Auditoriums { get; set; } = [];
}
