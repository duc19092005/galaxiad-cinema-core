namespace BussinessLayer.Dtos.facilities_manager.Movie_Infos.Movie_Format;

public class resFacilitiesManagerMovieFormatDto
{
    public Guid formatId { get; set; }
    
    public string formatName { get; set; }
    
    public string formatDescription { get; set; }
    
    public decimal movieFormatPrice { get; set; }
}