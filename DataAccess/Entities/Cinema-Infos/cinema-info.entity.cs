using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.User_Info;

namespace DataAccess.Entities.Cinema_Infos;
// ReSharper disable All

public class cinema_info_entity : base_management_status<user_info_entity>
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
    
    public Guid managerId { get; set; }


    public List<auditorium_info_entity> auditorium_info_entity { get; set; } = [];

    public List<cinema_discount_info_entity> cinema_discount_info_entity { get; set; } = [];

    public List<cinema_surcharge_infos_entity> cinema_surcharge_infos_entity { get; set; } = [];
    public user_info_entity? manager { get; set; }
    
    

}