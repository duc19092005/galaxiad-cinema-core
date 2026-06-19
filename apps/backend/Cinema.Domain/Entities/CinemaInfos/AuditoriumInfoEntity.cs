// ReSharper disable All

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Domain.Entities.CinemaInfos;

public partial class AuditoriumInfoEntities : BaseManagementStatus<UserInfoEntity>
{
    [Key]
    public Guid AuditoriumId { get; set; } 
    
    [Column(TypeName = "varchar(100)")]
    public string AuditoriumNumber { get; set; } = null!;
    
    public Guid CinemaId { get; set; }
    
    public List<SeatsInfoEntity> SeatsInfoEntity { get; set; } = null!;

    public List<MovieScheduleInfoEntity> MovieScheduleInfoEntity { get; set; } = [];
    
    public CinemaInfoEntity CinemaInfoEntity { get; set; } = null!;

    public List<AuditoriumFormatInfos> AuditoriumFormatInfosList { get; set; } = [];
}


