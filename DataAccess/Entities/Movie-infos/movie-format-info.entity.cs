using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.Cinema_Infos;
using DataAccess.Entities.User_Info;

namespace DataAccess.Entities.Movie_infos;
// ReSharper disable All

public class movieFormatInfoEntity : base_management_status<user_info_entity>
{
    [Key]
    public Guid movieFormatId { get; set; } 
    
    [Required]
    [Column(TypeName = "nvarchar(50)")]
    public string movieFormatName { get; set; } = null!;

    [Required]
    [Column(TypeName = "nvarchar(2000)")]
    public string movieFormatDescription { get; set; } = null!;
    
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal movieFormatPrice { get; set; }

    public virtual List<auditorium_info_entity> auditorium_info_entities { get; set; } = [];
    public virtual List<cinema_discount_info_entity> cinema_discount_info_entities { get; set; } = [];
    public virtual List<cinema_surcharge_infos_entity> cinema_surcharge_infos_entities { get; set; } = [];
    public virtual List<movie_schedule_info_entity> movie_schedule_info_entities { get; set; } = [];
    public virtual List<movieFormatMovieInfoEntity> movieFormatMovieInfoEntities { get; set; } = [];

}