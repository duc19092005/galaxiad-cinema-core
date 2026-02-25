using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.CinemaInfos;
using DataAccess.Entities.UserInfos;

namespace DataAccess.Entities.MovieInfos;
// ReSharper disable All

public class MovieFormatInfoEntity : BaseManagementStatus<UserInfoEntity>
{
    [Key]
    public Guid MovieFormatId { get; set; } 
    
    [Required]
    [Column(TypeName = "nvarchar(50)")]
    public string MovieFormatName { get; set; } = null!;

    [Required]
    [Column(TypeName = "nvarchar(2000)")]
    public string MovieFormatDescription { get; set; } = null!;
    
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal MovieFormatPrice { get; set; }

    public virtual List<AuditoriumInfoEntities> auditorium_info_entities { get; set; } = [];
    public virtual List<CinemaDiscountInfoEntity> cinema_discount_info_entities { get; set; } = [];
    public virtual List<CinemaSurchargeInfosEntity> cinema_surcharge_infos_entities { get; set; } = [];
    public virtual List<MovieScheduleInfoEntity> movie_schedule_info_entities { get; set; } = [];
    public virtual List<movieFormatMovieInfoEntity> movieFormatMovieInfoEntities { get; set; } = [];
    
    public List<AuditoriumFormatInfos> AuditoriumFormatInfosList { get; set; } = [];

}

