using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.CinemaInfos;
using DataAccess.Entities.MovieInfos;

namespace DataAccess.Entities.UserInfos;

public class OrderDetailsInfo
{
    public Guid OrderId { get; set; }
    
    public Guid SeatId { get; set; }
    
    public Guid MovieScheduleId { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal PriceEach { get; set; }

    public SeatsInfoEntity SeatsInfoEntity { get; set; } = null!;

    public MovieScheduleInfoEntity MovieScheduleInfoEntity { get; set; } = null!;
    
    public OrderInfoEntity OrderInfoEntity { get; set; }= null!;
}

