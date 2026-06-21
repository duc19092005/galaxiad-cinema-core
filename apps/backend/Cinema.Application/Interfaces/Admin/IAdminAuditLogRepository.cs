using Cinema.Application.Dtos.Admin.Responses;

namespace Cinema.Application.Interfaces.Admin;

public interface IAdminAuditLogRepository
{
    Task<List<AuditLogDto>> GetRecentAuditLogsAsync(int take, List<Guid>? cinemaIds, Guid? movieManagerUserId);
}
