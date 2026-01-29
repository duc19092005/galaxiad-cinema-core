
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.UserInfos;

namespace DataAccess.Entities.CinemaInfos;

public class SeatsInfoEntity
{
    [Key]
    [Column(TypeName = "varchar(100)")]
    public Guid SeatId { get; set; }

    [Column(TypeName = "nvarchar(50)")] 
    public string SeatNumber { get; set; } = null!;
    
    // Trục tọa độ x,y
    
    public double CoordX { get; set; } 
    
    public double CoordY { get; set; }
    
    // Thông tin GRID VIEW

    public int ColIndex { get; set; }

    public int RowIndex { get; set; }
    
    // Foreign Key
    
    [ForeignKey("AuditoriumInfoEntities")]
    
    public Guid AuditoriumId { get; set; }

    public AuditoriumInfoEntities AuditoriumInfoEntities { get; set; } = null!;

}

