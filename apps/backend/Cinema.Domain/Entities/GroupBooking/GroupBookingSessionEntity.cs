using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;

namespace Cinema.Domain.Entities.GroupBooking;

public class GroupBookingSessionEntity
{
    public Guid GroupSessionId { get; set; }

    [Column(TypeName = "varchar(12)")]
    public string GroupCode { get; set; } = string.Empty;

    public Guid CreatedByUserId { get; set; }

    public Guid MovieScheduleId { get; set; }

    [Column(TypeName = "nvarchar(200)")]
    public string? GroupName { get; set; }

    public GroupBookingStatusEnum Status { get; set; }

    public int MaxMembers { get; set; } = 8;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ExpiresAt { get; set; }

    public DateTime? PaymentDeadlineAt { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalGroupAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CollectedAmount { get; set; }

    public int VoteMovieScheduleId { get; set; }

    [Column(TypeName = "nvarchar(500)")]
    public string? VotingOptionsJson { get; set; }

    public UserInfoEntity UserInfoEntity { get; set; } = null!;

    public MovieInfos.MovieScheduleInfoEntity MovieScheduleInfoEntity { get; set; } = null!;

    public List<GroupBookingMemberEntity> Members { get; set; } = [];

    public List<GroupChatMessageEntity> ChatMessages { get; set; } = [];
}
