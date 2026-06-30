using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;

namespace Cinema.Domain.Entities.GroupBooking;

public class GroupBookingMemberEntity
{
    public Guid MemberId { get; set; }

    public Guid GroupSessionId { get; set; }

    public Guid UserId { get; set; }

    public bool IsHost { get; set; }

    public GroupMemberStatusEnum Status { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal AmountToPay { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal AmountPaid { get; set; }

    [Column(TypeName = "varchar(100)")]
    public string? VnPayTransactionId { get; set; }

    [Column(TypeName = "varchar(100)")]
    public string? CoverPaymentTransactionId { get; set; }

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public DateTime? PaidAt { get; set; }

    public GroupBookingSessionEntity GroupBookingSession { get; set; } = null!;

    public UserInfoEntity UserInfoEntity { get; set; } = null!;

    public List<GroupBookingSeatEntity> SelectedSeats { get; set; } = [];
}
