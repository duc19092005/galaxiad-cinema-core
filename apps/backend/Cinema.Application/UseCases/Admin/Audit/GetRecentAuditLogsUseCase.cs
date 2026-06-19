using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Application.Interfaces;
using Cinema.Domain.Entities.AuditLogs;
using Cinema.Domain.Entities.CinemaInfos;
using Microsoft.EntityFrameworkCore;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Admin.Audit;

public class GetRecentAuditLogsUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserContextService _userContextService;

    public GetRecentAuditLogsUseCase(IUnitOfWork unitOfWork, IUserContextService userContextService)
    {
        _unitOfWork = unitOfWork;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<List<AuditLogDto>>> ExecuteAsync(int take = 30)
    {
        var userId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");
        var isFacilitiesManager = _userContextService.IsInRole("FacilitiesManager");
        var isTheaterManager = _userContextService.IsInRole("TheaterManager");
        var isMovieManager = _userContextService.IsInRole("MovieManager");

        var query = _unitOfWork.Repository<AuditLogEntity>().Query().AsNoTracking();

        if (!isAdmin)
        {
            if (isFacilitiesManager || isTheaterManager)
            {
                var cinemaIds = _unitOfWork.Repository<CinemaInfoEntity>().Query()
                    .Where(c =>
                        (isFacilitiesManager && c.FacilitiesManagerId == userId) ||
                        (isTheaterManager && c.TheaterManagerId == userId))
                    .Select(c => c.CinemaId);

                query = query.Where(log => log.CinemaId != null && cinemaIds.Contains(log.CinemaId.Value));
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
