using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Admin.Responses;
using BusinessLayer.Services.IdentityAccess;
using DataAccess;
using DataAccess.Entities.AuditLogs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BusinessLayer.Services.Admin.Audit;

public class AuditLogService
{
    private readonly CinemaDbContext _dbContext;
    private readonly IUserContextService _userContextService;
    private readonly ILogger<AuditLogService> _logger;

    public AuditLogService(
        CinemaDbContext dbContext,
        IUserContextService userContextService,
        ILogger<AuditLogService> logger)
    {
        _dbContext = dbContext;
        _userContextService = userContextService;
        _logger = logger;
    }

    public async Task WriteAsync(
        string action,
        string entityType,
        Guid? entityId,
        string entityName,
        string description,
        Guid? cinemaId = null)
    {
        try
        {
            var actorUserId = _userContextService.GetUserId();
            var actor = await _dbContext.UserInfoEntity
                .AsNoTracking()
                .Where(u => u.UserId == actorUserId)
                .Select(u => new
                {
                    u.UserId,
                    UserName = u.UserProfileEntity != null ? u.UserProfileEntity.UserName : u.UserEmail,
                    Roles = u.UserRoleInfoEntity.Select(r => r.RoleListInfoEntity.RoleName).ToList()
                })
                .FirstOrDefaultAsync();

            if (actor == null)
            {
                return;
            }

            var isAdmin = actor.Roles.Contains("Admin");
            var primaryRole = isAdmin
                ? "Admin"
                : actor.Roles.FirstOrDefault(r => r != "User" && r != "Cashier") ?? actor.Roles.FirstOrDefault() ?? "";

            await _dbContext.AuditLogEntity.AddAsync(new AuditLogEntity
            {
                AuditLogId = Guid.NewGuid(),
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                EntityName = entityName,
                Description = description,
                ActorUserId = actor.UserId,
                ActorName = actor.UserName,
                ActorPrimaryRole = primaryRole,
                IsAdminAction = isAdmin,
                CinemaId = cinemaId,
                CreatedAt = DateTime.Now
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Could not create audit log for {Action} {EntityType}", action, entityType);
        }
    }

    public async Task<BaseResponse<List<AuditLogDto>>> GetRecentAsync(int take = 30)
    {
        var userId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");
        var isFacilitiesManager = _userContextService.IsInRole("FacilitiesManager");
        var isTheaterManager = _userContextService.IsInRole("TheaterManager");
        var isMovieManager = _userContextService.IsInRole("MovieManager");

        var query = _dbContext.AuditLogEntity.AsNoTracking().AsQueryable();

        if (!isAdmin)
        {
            if (isFacilitiesManager || isTheaterManager)
            {
                var cinemaIds = _dbContext.CinemaInfoEntity
                    .Where(c =>
                        (isFacilitiesManager && c.FacilitiesManagerId == userId) ||
                        (isTheaterManager && c.TheaterManagerId == userId))
                    .Select(c => c.CinemaId);

                query = query.Where(log =>
                    log.CinemaId != null && cinemaIds.Contains(log.CinemaId.Value));
            }
            else if (isMovieManager)
            {
                query = query.Where(log => log.EntityType == "Movie" && log.ActorUserId == userId);
            }
            else
            {
                query = query.Where(log => false);
            }
        }

        var logs = await query
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

        return new BaseResponse<List<AuditLogDto>>
        {
            IsSuccess = true,
            Message = "Get audit logs successfully.",
            Data = logs
        };
    }
}
