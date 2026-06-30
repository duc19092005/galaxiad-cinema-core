using System.ComponentModel.DataAnnotations.Schema;

namespace Cinema.Domain.Entities.GroupBooking;

public class GroupBookingSeatEntity
{
    public Guid GroupSeatId { get; set; }

    public Guid MemberId { get; set; }

    public Guid SeatId { get; set; }

    public bool IsConfirmed { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PriceEach { get; set; }

    public DateTime SelectedAt { get; set; } = DateTime.UtcNow;

    public GroupBookingMemberEntity GroupBookingMember { get; set; } = null!;

    public CinemaInfos.SeatsInfoEntity SeatsInfoEntity { get; set; } = null!;
}
