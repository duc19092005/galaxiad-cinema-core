// ReSharper disable All

using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Domain.Entities.CinemaInfos;

public class CinemaSurchargeInfosEntity : BaseManagementStatus<UserInfoEntity>
{
    public Guid CinemaId { get; set; }
    
    public Guid MovieFormatId { get; set; }
    
    public Guid UserSegmentId { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal SurchangePercent { get; set; }

    public CinemaInfoEntity CinemaInfoEntity { get; set; } = null!;

    public MovieFormatInfoEntity MovieFormatInfoEntity { get; set; } = null!;

    public UserSegmentsInfoEntity UserSegmentsInfoEntity { get; set; } = null!;
}


