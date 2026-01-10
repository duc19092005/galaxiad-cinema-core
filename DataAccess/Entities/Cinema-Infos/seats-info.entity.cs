// ReSharper disable All

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.User_Info;

namespace DataAccess.Entities.Cinema_Infos;

public class seats_info_entity : base_deleted_entity<user_info_entity>
{
    [Key]
    [Column(TypeName = "varchar(100)")]
    public string seatId { get; set; } = null!;

    [Column(TypeName = "nvarchar(50)")] 
    public string seatNumber { get; set; } = null!;
    
    // Trục tọa độ x,y
    
    public double coordX { get; set; } 
    
    public double coordY { get; set; }
    
    // Thông tin GRID VIEW

    public int colIndex { get; set; }

    public int rowIndex { get; set; }
    
}