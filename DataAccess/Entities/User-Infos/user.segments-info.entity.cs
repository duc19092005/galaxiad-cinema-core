namespace DataAccess.Entities.User_Info;

public class user_segments_info_entity
{
    public Guid userSegmentId { get; set; }

    public string userSegmentName { get; set; } = string.Empty;
    
    public string userSegmentDescription { get; set; } = string.Empty;
}