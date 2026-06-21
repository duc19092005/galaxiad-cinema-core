using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Application.Interfaces.Admin;
using Cinema.Domain.Entities.AuditLogs;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Repositories;

public class AdminAuditLogRepository : IAdminAuditLogRepository
{
    private readonly CinemaDbContext _dbContext;

    public AdminAuditLogRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<AuditLogDto>> GetRecentAuditLogsAsync(int take, List<Guid>? cinemaIds, Guid? movieManagerUserId)
    {
        var query = _dbContext.Set<AuditLogEntity>().AsNoTracking();

        if (cinemaIds != null)
        {
            query = query.Where(log => log.CinemaId != null && cinemaIds.Contains(log.CinemaId.Value));
        }
        else if (movieManagerUserId.HasValue)
        {
            query = query.Where(log => log.EntityType == "Movie" && log.ActorUserId == movieManagerUserId.Value);
        }

        return await query
            .OrderByDescending(log => log.CreatedAt)
            .Take(Math.Clamp(take, 1, 100))
            .Select(log => new AuditLogDto
            {
                AuditLogId = log.AuditLogId,
                Action = log.Action,
                EntityType = log.EntityType,
                EntityId = log.EntityId,
                EntityName = log.EntityName,
                Description = log.Description,
                ActorUserId = log.ActorUserId,
                ActorName = log.ActorName,
                ActorPrimaryRole = log.ActorPrimaryRole,
                IsAdminAction = log.IsAdminAction,
                CinemaId = log.CinemaId,
                CreatedAt = DateTime.SpecifyKind(log.CreatedAt, DateTimeKind.Utc)
            })
            .ToListAsync();
    }
}
