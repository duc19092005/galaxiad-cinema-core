// ReSharper disable All

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.Cinema_Infos;
using DataAccess.Entities.User_Info;

namespace DataAccess.Entities.Cinema_Infos;

public class auditorium_info_entity : base_deleted_entity<user_info_entity>
{
    [Key]
    public Guid auditoriumId { get; set; } 
    
    [Column(TypeName = "varchar(100)")]
    public string auditoriumNumber { get; set; } = null!;
    
    // Movie Format Infos
    
    [ForeignKey("movie_format_info_entity")]
    
    public Guid movieFormatId { get; set; } 

    public movie_format_info_entity movie_format_info_entity { get; set; } = null!;
    
    public List<seats_info_entity> seats_info_entity { get; set; } = null!;
}