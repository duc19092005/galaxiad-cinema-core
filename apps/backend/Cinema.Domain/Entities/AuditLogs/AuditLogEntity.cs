using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Cinema.Domain.Entities.AuditLogs;

public class AuditLogEntity
{
    [Key]
    public Guid AuditLogId { get; set; }

    [Column(TypeName = "varchar(50)")]
    public string Action { get; set; } = string.Empty;

    [Column(TypeName = "varchar(80)")]
    public string EntityType { get; set; } = string.Empty;

    public Guid? EntityId { get; set; }

    [Column(TypeName = "nvarchar(300)")]
    public string EntityName { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(1000)")]
    public string Description { get; set; } = string.Empty;

    public Guid ActorUserId { get; set; }

    [Column(TypeName = "nvarchar(100)")]
    public string ActorName { get; set; } = string.Empty;

    [Column(TypeName = "varchar(50)")]
    public string ActorPrimaryRole { get; set; } = string.Empty;

    public bool IsAdminAction { get; set; }

    public Guid? CinemaId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
