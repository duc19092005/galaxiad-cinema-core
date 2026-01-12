using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.User_Info;

namespace DataAccess.Entities.Cinema_Infos;
// ReSharper disable All

public class cinema_info_entity : base_deleted_entity<user_info_entity>
{
    [Key]
    public Guid cinemaId { get; set; } 
    
    [Column(TypeName = "nvarchar(100)")]
    public string cinemaLocation { get; set; } = null!;
    
    [Column(TypeName = "nvarchar(1000)")]
    public string cinemaName { get; set; } = null!;

    [Column(TypeName = "char(10)")]
    public string cinemaHotLineNumber { get; set; } = null!;

    [Column(TypeName = "nvarchar(max)")]
    public string cinemaDescription { get; set; } = null!;

    public List<auditorium_info_entity> auditorium_info_entity { get; set; } = [];

}