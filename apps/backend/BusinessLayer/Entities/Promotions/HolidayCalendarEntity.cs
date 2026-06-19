using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BusinessLayer.Entities.Promotions;

public class HolidayCalendarEntity
{
    [Key]
    public Guid HolidayId { get; set; }

    [Column(TypeName = "nvarchar(150)")]
    public string Name { get; set; } = string.Empty;

    [Column(TypeName = "date")]
    public DateTime Date { get; set; }

    public bool IsActive { get; set; } = true;
}
