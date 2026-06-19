namespace Cinema.Application.Dtos.FacilitiesManager.Auditoriums.Responses;

public class GetResAuditoriumDtoCinema
{
    public Guid AuditoriumId { get; set; }
    
    public string AuditoriumNumber { get; set; } = string.Empty;
    
    public IEnumerable<BaseFormatInfo> FormatInfos { get; set; } = [];

    public string CinemaName { get; set; } = string.Empty;
    
    public int TotalSeats { get; set; }
}

public class GetResAuditoriumDto
{
    public Guid AuditoriumId { get; set; }
    
    public string AuditoriumNumber { get; set; } = string.Empty;

    public IEnumerable<BaseFormatInfo> FormatInfos { get; set; } = [];
    
    public string CinemaName { get; set; } = string.Empty;
    
    public int TotalSeats { get; set; }

    public IEnumerable<Requests.ReqSeatsAuditoriumDto> SeatsInfos { get; set; } = [];
}
