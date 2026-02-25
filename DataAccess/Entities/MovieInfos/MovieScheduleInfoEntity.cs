using DataAccess.Entities.CinemaInfos;
using DataAccess.Entities.UserInfos;

namespace DataAccess.Entities.MovieInfos;

public class MovieScheduleInfoEntity : BaseManagementStatus<UserInfoEntity>
{
    public Guid MovieScheduleInfoId { get; set; }
    
    public Guid MovieId { get; set; }
    
    public Guid AuditoriumId { get; set; }
    
    public Guid MovieFormatId { get; set; }
    
    public DateTime EndedTime { get; set; }
    
    public MovieFormatInfoEntity? MovieFormatInfoEntity { get; set; }

    public MovieInfoEntity? MovieInfoEntity { get; set; } = null!;
    
    public AuditoriumInfoEntities? AuditoriumInfoEntities { get; set; }
    
    
    public List<OrderDetailsInfo>? OrderDetailsInfos { get; set; }
}


