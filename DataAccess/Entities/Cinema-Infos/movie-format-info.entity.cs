using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.User_Info;

namespace DataAccess.Entities.Cinema_Infos;
// ReSharper disable All

public class movie_format_info_entity : base_deleted_entity<user_info_entity>
{
    [Key]
    [Column(TypeName = "varchar(100)")]
    public string movieFormatId { get; set; } = null!;
    
    [Required]
    [Column(TypeName = "nvarchar(50)")]
    public string movieFormatName { get; set; } = null!;

    [Required]
    [Column(TypeName = "nvarchar(max)")]
    public string movieFormatDescription { get; set; } = null!;

    public List<auditorium_info_entity> auditorium_info_entity = null!;
}