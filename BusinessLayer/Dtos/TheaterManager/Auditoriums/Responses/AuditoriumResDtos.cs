namespace BusinessLayer.Dtos.TheaterManager.Auditoriums.Responses;

public class TheaterManagerAuditoriumRes
{
    public string CinemaName { get; set; } = String.Empty;
    
    public string CinemaLocation { get; set; } = String.Empty;
    
    public string CinemaHotLineNumber { get; set; } = String.Empty;
    
    public int TotalAuditoriums { get; set; } = 0;
    
    public string TheaterManagerName { get; set; } = string.Empty;
    public string FacilitiesManagerName { get; set; } = string.Empty;

    public List<TheaterManagerAuditoriumInfos> AuditoriumInfosList { get; set; } = [];
}

public class TheaterManagerAuditoriumInfos
{
    public Guid AuditoriumId { get; set; } 
    public string AuditoriumNumber { get; set; } = string.Empty;
    public int TotalSeats { get; set; } = 0;
    
    public IEnumerable<string> AuditoriumSupportedFormats =  Array.Empty<string>(); 
}
