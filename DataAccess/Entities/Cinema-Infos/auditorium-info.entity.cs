// ReSharper disable All

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.Cinema_Infos;
using DataAccess.Entities.Movie_infos;
using DataAccess.Entities.User_Info;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Entities.Cinema_Infos;

public partial class auditorium_info_entity : base_management_status<user_info_entity>
{
    [Key]
    public Guid auditoriumId { get; set; } 
    
    [Column(TypeName = "varchar(100)")]
    public string auditoriumNumber { get; set; } = null!;
    
    // Movie Format Infos
    
    [ForeignKey("movie_format_info_entity")]
    
    public Guid movieFormatId { get; set; } 
    
    public Guid cinemaId { get; set; }

    public movieFormatInfoEntity movie_format_info_entity { get; set; } = null!;
    
    public List<seats_info_entity> seats_info_entity { get; set; } = null!;

    public List<movie_schedule_info_entity> movie_schedule_info_entity { get; set; } = [];
    public cinema_info_entity cinema_info_entity { get; set; } = null!;
}
