using DataAccess.Entities.Movie_infos;

namespace DataAccess.Entities.User_Info;

public class order_details_info
{
    public Guid orderId { get; set; }
    
    public Guid seatId { get; set; }
    
    public Guid movieScheduleId { get; set; }
    
    public decimal priceEach { get; set; }
    
    public movie_schedule_info_entity movie_schedule_info { get; set; }
    
    public order_info_entity order_info { get; set; }
}