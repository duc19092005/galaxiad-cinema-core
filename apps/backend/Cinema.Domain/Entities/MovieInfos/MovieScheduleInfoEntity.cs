using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Domain.Entities.MovieInfos;

public class MovieScheduleInfoEntity : BaseManagementStatus<UserInfoEntity>
{
    public Guid MovieScheduleInfoId { get; set; }
    
    public Guid MovieId { get; set; }
    
    public Guid AuditoriumId { get; set; }
    
    public Guid MovieFormatId { get; set; }
    
    public DateTime StartTime { get; set; }
    
    public DateTime EndedTime { get; set; }
    
    public MovieFormatInfoEntity? MovieFormatInfoEntity { get; set; }

    public MovieInfoEntity? MovieInfoEntity { get; set; } = null!;
    
    public AuditoriumInfoEntities? AuditoriumInfoEntities { get; set; }
    
    
    public List<OrderDetailsInfo>? OrderDetailsInfos { get; set; }
}


