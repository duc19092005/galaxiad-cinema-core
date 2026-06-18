namespace BusinessLayer.Dtos.Admin.Responses;

public class AuditLogDto
{
    public Guid AuditLogId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid ActorUserId { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public string ActorPrimaryRole { get; set; } = string.Empty;
    public bool IsAdminAction { get; set; }
    public Guid? CinemaId { get; set; }
    public DateTime CreatedAt { get; set; }
}
