using System.ComponentModel.DataAnnotations;

namespace BusinessLayer.Dtos.TheaterManager.MovieSchedules.Responses;

public class TheaterManagerMovieScheduleResDto
{
    public Guid ScheduleId { get; set; }
    public Guid MovieId { get; set; }
    public string MovieName { get; set; } = string.Empty;
    public Guid FormatId { get; set; }
    public string FormatName { get; set; } = string.Empty;
    public Guid AuditoriumId { get; set; }
    public DateTime StartedDate { get; set; }
    public DateTime EndedTime { get; set; }
    public bool IsDeleted { get; set; }
}
