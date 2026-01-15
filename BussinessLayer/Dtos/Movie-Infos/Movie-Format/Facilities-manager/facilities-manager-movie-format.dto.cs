namespace BussinessLayer.Dtos.Movie_Infos.Movie_Format;

public class facilities_manager_res_movie_format_dto
{
    public Guid formatId { get; set; }
    
    public string formatName { get; set; }
    
    public string formatDescription { get; set; }
    
    public decimal movieFormatPrice { get; set; }
}