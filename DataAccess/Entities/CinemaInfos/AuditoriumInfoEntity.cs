// ReSharper disable All

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.CinemaInfos;
using DataAccess.Entities.MovieInfos;
using DataAccess.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Entities.CinemaInfos;

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

    public List<AuditoriumFormatInfos> AuditoriumFormatInfosList = [];
}


