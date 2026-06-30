using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;

namespace Cinema.Domain.Entities.GroupBooking;

public class GroupChatMessageEntity
{
    public Guid MessageId { get; set; }

    public Guid GroupSessionId { get; set; }

    public Guid? SenderId { get; set; }

    [Column(TypeName = "nvarchar(2000)")]
    public string Content { get; set; } = string.Empty;

    public GroupChatMessageTypeEnum MessageType { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public GroupBookingSessionEntity GroupBookingSession { get; set; } = null!;

    public UserInfoEntity? UserInfoEntity { get; set; }
}
