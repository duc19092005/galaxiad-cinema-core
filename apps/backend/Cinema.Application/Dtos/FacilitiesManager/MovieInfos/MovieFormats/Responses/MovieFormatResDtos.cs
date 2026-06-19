namespace Cinema.Application.Dtos.FacilitiesManager.MovieInfos.MovieFormats.Responses;

public class ResFacilitiesManagerMovieFormatDto
{
    public Guid FormatId { get; set; }
    
    public string FormatName { get; set; } = string.Empty;
    
    public string FormatDescription { get; set; } = string.Empty;
    
    public decimal MovieFormatPrice { get; set; }
}
