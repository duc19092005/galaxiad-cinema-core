using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Admin.Responses;

namespace Cinema.Application.Interfaces;

public interface IAuditLogService
{
    Task WriteAsync(
        string action,
        string entityType,
        Guid? entityId,
        string entityName,
        string description,
        Guid? cinemaId = null);

    Task<BaseResponse<List<AuditLogDto>>> GetRecentAsync(int take = 30);
}
