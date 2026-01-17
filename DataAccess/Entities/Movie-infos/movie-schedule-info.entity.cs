using DataAccess.Entities.Cinema_Infos;
using DataAccess.Entities.User_Info;

namespace DataAccess.Entities.Movie_infos;

public class movie_schedule_info_entity : base_management_status<user_info_entity>
{
    public Guid movieScheduleInfoId { get; set; }
    
    public Guid movieId { get; set; }
    
    public Guid auditoriumId { get; set; }
    
    public Guid movieFormatId { get; set; }
    
    public DateTime startedTime { get; set; }
    
    public DateTime endedTime { get; set; }
    
    public movieFormatInfoEntity movie_format_info_entity { get; set; }
    
    public movieInfoEntity movie_info_entity { get; set; }
    
    public auditorium_info_entity  auditorium_info_entity { get; set; }
    
    
    public List<order_details_info> order_details_infos { get; set; }
}