using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.User_Info;

namespace DataAccess.Entities.Cinema_Infos;
// ReSharper disable All

public class movie_format_info_entity : base_management_status<user_info_entity>
{
    [Key]
    public Guid movieFormatId { get; set; } 
    
    [Required]
    [Column(TypeName = "nvarchar(50)")]
    public string movieFormatName { get; set; } = null!;

    [Required]
    [Column(TypeName = "nvarchar(max)")]
    public string movieFormatDescription { get; set; } = null!;
    
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal movieFormatPrice { get; set; }

    public List<auditorium_info_entity> auditorium_info_entity = null!;
    
    public List<cinema_discount_info_entity> cinema_discount_info_entity { get; set; } = [];

}