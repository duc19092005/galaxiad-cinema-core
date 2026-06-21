using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Application.Interfaces.Admin;
using Cinema.Domain.Entities.AuditLogs;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Repositories;

public class AdminDashboardRepository : IAdminDashboardRepository
{
    private readonly CinemaDbContext _dbContext;

    public AdminDashboardRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<int> GetActiveUsersCountAsync()
    {
        return await _dbContext.Set<UserInfoEntity>()
            .AsNoTracking()
            .CountAsync(u => u.AccountStatus == AccountStatusEnum.Active);
    }

    public async Task<int> GetCinemasCountAsync(List<Guid>? cinemaIds)
    {
        var query = _dbContext.Set<CinemaInfoEntity>().AsNoTracking().Where(c => !c.IsDeleted);
        if (cinemaIds != null)
        {
            query = query.Where(c => cinemaIds.Contains(c.CinemaId));
        }

        return await query.CountAsync();
    }

    public async Task<int> GetActiveMoviesCountAsync(List<Guid>? movieIds, Guid? cinemaId)
    {
        var query = _dbContext.Set<MovieInfoEntity>().AsNoTracking().Where(m => !m.IsDeleted && m.IsActive);
        if (cinemaId.HasValue)
        {
            query = query.Where(m => m.MovieCinemaEntities.Any(mc => mc.CinemaId == cinemaId.Value));
        }
        else if (movieIds != null)
        {
            query = query.Where(m => movieIds.Contains(m.MovieId));
        }

        return await query.CountAsync();
    }

    public async Task<int> GetActiveSchedulesCountAsync(List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId)
    {
        var query = _dbContext.Set<MovieScheduleInfoEntity>().AsNoTracking().Where(s => !s.IsDeleted && s.IsActive);
        if (cinemaId.HasValue)
        {
            query = query.Where(s => s.AuditoriumInfoEntities!.CinemaId == cinemaId.Value);
        }
        else
        {
            if (cinemaIds != null)
            {
                query = query.Where(s => cinemaIds.Contains(s.AuditoriumInfoEntities!.CinemaId));
            }

            if (movieIds != null)
            {
                query = query.Where(s => movieIds.Contains(s.MovieId));
            }
        }

        return await query.CountAsync();
    }

    public async Task<int> GetPaidOrdersCountAsync(List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId)
    {
        var paidStatuses = new[] { OrderStatusEnum.Booked, OrderStatusEnum.Completed };
        var query = _dbContext.Set<OrderInfoEntity>().AsNoTracking().Where(o => paidStatuses.Contains(o.OrderStatus));
        if (cinemaId.HasValue)
        {
            query = query.Where(o => o.OrderDetailsInfo.Any(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaId == cinemaId.Value));
        }
        else if (cinemaIds != null || movieIds != null)
        {
            query = query.Where(o => o.OrderDetailsInfo.Any(od =>
                (cinemaIds != null && cinemaIds.Contains(od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaId)) ||
                (movieIds != null && movieIds.Contains(od.MovieScheduleInfoEntity.MovieId))));
        }

        return await query.CountAsync();
    }

    public async Task<decimal> GetRevenueAsync(DateTime start, DateTime end, List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId)
    {
        var query = BuildPaidOrderDetailsQuery(cinemaIds, movieIds, cinemaId)
            .Where(od => od.OrderInfoEntity.OrderDate >= start && od.OrderInfoEntity.OrderDate < end);

        return await query.SumAsync(od => (decimal?)od.PriceEach) ?? 0;
    }

    public async Task<(int tickets, decimal revenue)> GetTodayStatsAsync(DateTime start, DateTime end, List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId)
    {
        var query = BuildPaidOrderDetailsQuery(cinemaIds, movieIds, cinemaId)
            .Where(od => od.OrderInfoEntity.OrderDate >= start && od.OrderInfoEntity.OrderDate < end);

        var tickets = await query.CountAsync();
        var revenue = await query.SumAsync(od => (decimal?)od.PriceEach) ?? 0;
        return (tickets, revenue);
    }

    public async Task<int> GetTotalTicketsSoldAsync(List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId)
    {
        return await BuildPaidOrderDetailsQuery(cinemaIds, movieIds, cinemaId).CountAsync();
    }

    public async Task<List<DailyRevenueStatRow>> GetDailyRevenueStatsAsync(DateTime start, DateTime end, List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId)
    {
        return await BuildPaidOrderDetailsQuery(cinemaIds, movieIds, cinemaId)
            .Where(od => od.OrderInfoEntity.OrderDate >= start && od.OrderInfoEntity.OrderDate < end)
            .Select(od => new DailyRevenueStatRow { OrderDate = od.OrderInfoEntity.OrderDate, PriceEach = od.PriceEach })
            .ToListAsync();
    }

    public async Task<List<DateTime>> GetOrderDatesForHourlyStatsAsync(List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId)
    {
        return await BuildPaidOrderDetailsQuery(cinemaIds, movieIds, cinemaId)
            .Select(od => od.OrderInfoEntity.OrderDate)
            .ToListAsync();
    }

    public async Task<List<MovieTicketStatDto>> GetMovieTicketStatsAsync(List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId)
    {
        return await BuildPaidOrderDetailsQuery(cinemaIds, movieIds, cinemaId)
            .GroupBy(od => new { od.MovieScheduleInfoEntity.MovieId, od.MovieScheduleInfoEntity.MovieInfoEntity!.MovieName })
            .Select(g => new MovieTicketStatDto
            {
                MovieId = g.Key.MovieId,
                MovieName = g.Key.MovieName,
                TicketsSold = g.Count(),
                Revenue = g.Sum(x => x.PriceEach)
            })
            .OrderByDescending(x => x.TicketsSold)
            .Take(10)
            .ToListAsync();
    }

    public async Task<List<HotMovieDto>> GetHotMoviesAsync(List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId)
    {
        return await BuildPaidOrderDetailsQuery(cinemaIds, movieIds, cinemaId)
            .GroupBy(od => new
            {
                od.MovieScheduleInfoEntity.MovieId,
                od.MovieScheduleInfoEntity.MovieInfoEntity!.MovieName,
                od.MovieScheduleInfoEntity.MovieInfoEntity.MovieImageUrl
            })
            .Select(g => new HotMovieDto
            {
                MovieId = g.Key.MovieId,
                MovieName = g.Key.MovieName,
                MovieImageUrl = g.Key.MovieImageUrl,
                TicketsSold = g.Count(),
                Revenue = g.Sum(x => x.PriceEach)
            })
            .OrderByDescending(x => x.TicketsSold)
            .Take(8)
            .ToListAsync();
    }

    public async Task<List<RecentTransactionDto>> GetRecentTransactionsAsync(int take, List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId)
    {
        var paidStatuses = new[] { OrderStatusEnum.Booked, OrderStatusEnum.Completed };
        var query = _dbContext.Set<OrderInfoEntity>().AsNoTracking().Where(o => paidStatuses.Contains(o.OrderStatus));
        if (cinemaId.HasValue)
        {
            query = query.Where(o => o.OrderDetailsInfo.Any(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaId == cinemaId.Value));
        }
        else if (cinemaIds != null || movieIds != null)
        {
            query = query.Where(o => o.OrderDetailsInfo.Any(od =>
                (cinemaIds != null && cinemaIds.Contains(od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaId)) ||
                (movieIds != null && movieIds.Contains(od.MovieScheduleInfoEntity.MovieId))));
        }

        return await query
            .OrderByDescending(o => o.OrderDate)
            .Take(take)
            .Select(o => new RecentTransactionDto
            {
                OrderId = o.OrderId,
                OrderDate = DateTime.SpecifyKind(o.OrderDate, DateTimeKind.Utc),
                MovieName = o.OrderDetailsInfo.Select(od => od.MovieScheduleInfoEntity.MovieInfoEntity!.MovieName).FirstOrDefault() ?? "",
                CinemaName = o.OrderDetailsInfo.Select(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaInfoEntity.CinemaName).FirstOrDefault() ?? "",
                TicketCount = o.TotalQuantity,
                TotalPrice = o.TotalPrice,
                CustomerName = o.CustomerName ?? o.CustomerEmail ?? "Guest"
            })
            .ToListAsync();
    }

    public async Task<List<RecentMovieDto>> GetRecentMoviesAsync(int take, Guid? cinemaId, Guid? movieManagerUserId)
    {
        var query = _dbContext.Set<MovieInfoEntity>().AsNoTracking().Where(m => !m.IsDeleted);
        if (cinemaId.HasValue)
        {
            query = query.Where(m => m.MovieCinemaEntities.Any(mc => mc.CinemaId == cinemaId.Value));
        }
        else if (movieManagerUserId.HasValue)
        {
            query = query.Where(m => m.MovieManagerId == movieManagerUserId.Value);
        }

        return await query.OrderByDescending(m => m.CreatedAt).Take(take)
            .Select(m => new RecentMovieDto
            {
                MovieId = m.MovieId,
                MovieName = m.MovieName,
                MovieImageUrl = m.MovieImageUrl,
                CreatedAt = DateTime.SpecifyKind(m.CreatedAt, DateTimeKind.Utc),
                CreatedBy = _dbContext.Set<UserInfoEntity>().Where(u => u.UserId == m.CreatedByUserId).Select(u => u.UserName).FirstOrDefault() ?? "System"
            }).ToListAsync();
    }

    public async Task<List<RecentCinemaDto>> GetRecentCinemasAsync(int take, Guid? cinemaId, List<Guid>? allowedCinemaIds)
    {
        var query = _dbContext.Set<CinemaInfoEntity>().AsNoTracking().Where(c => !c.IsDeleted);
        if (cinemaId.HasValue)
        {
            query = query.Where(c => c.CinemaId == cinemaId.Value);
        }
        else if (allowedCinemaIds != null)
        {
            query = query.Where(c => allowedCinemaIds.Contains(c.CinemaId));
        }

        return await query.OrderByDescending(c => c.CreatedAt).Take(take)
            .Select(c => new RecentCinemaDto
            {
                CinemaId = c.CinemaId,
                CinemaName = c.CinemaName,
                CinemaLocation = c.CinemaLocation,
                CreatedAt = DateTime.SpecifyKind(c.CreatedAt, DateTimeKind.Utc),
                CreatedBy = _dbContext.Set<UserInfoEntity>().Where(u => u.UserId == c.CreatedByUserId).Select(u => u.UserName).FirstOrDefault() ?? "System"
            }).ToListAsync();
    }

    public async Task<List<RecentAuditoriumDto>> GetRecentAuditoriumsAsync(int take, Guid? cinemaId, List<Guid>? allowedCinemaIds)
    {
        var query = _dbContext.Set<AuditoriumInfoEntities>().AsNoTracking().Where(a => !a.IsDeleted);
        if (cinemaId.HasValue)
        {
            query = query.Where(a => a.CinemaId == cinemaId.Value);
        }
        else if (allowedCinemaIds != null)
        {
            query = query.Where(a => allowedCinemaIds.Contains(a.CinemaId));
        }

        return await query.OrderByDescending(a => a.CreatedAt).Take(take)
            .Select(a => new RecentAuditoriumDto
            {
                AuditoriumId = a.AuditoriumId,
                AuditoriumNumber = a.AuditoriumNumber,
                CinemaName = a.CinemaInfoEntity.CinemaName,
                CreatedAt = DateTime.SpecifyKind(a.CreatedAt, DateTimeKind.Utc),
                CreatedBy = _dbContext.Set<UserInfoEntity>().Where(u => u.UserId == a.CreatedByUserId).Select(u => u.UserName).FirstOrDefault() ?? "System"
            }).ToListAsync();
    }

    public async Task<List<AuditLogDto>> GetRecentAuditLogsForDashboardAsync(int take, Guid? cinemaId, List<Guid>? allowedCinemaIds, Guid? movieManagerUserId)
    {
        var query = _dbContext.Set<AuditLogEntity>().AsNoTracking();
        if (cinemaId.HasValue)
        {
            query = query.Where(log => log.CinemaId == cinemaId.Value);
        }
        else if (allowedCinemaIds != null)
        {
            query = query.Where(log => log.CinemaId != null && allowedCinemaIds.Contains(log.CinemaId.Value));
        }
        else if (movieManagerUserId.HasValue)
        {
            query = query.Where(log => log.EntityType == "Movie" && log.ActorUserId == movieManagerUserId.Value);
        }

        return await query.OrderByDescending(log => log.CreatedAt).Take(take)
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
            }).ToListAsync();
    }

    private IQueryable<OrderDetailsInfo> BuildPaidOrderDetailsQuery(List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId)
    {
        var paidStatuses = new[] { OrderStatusEnum.Booked, OrderStatusEnum.Completed };
        var query = _dbContext.Set<OrderDetailsInfo>().AsNoTracking()
            .Where(od => paidStatuses.Contains(od.OrderInfoEntity.OrderStatus));

        if (cinemaId.HasValue)
        {
            query = query.Where(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaId == cinemaId.Value);
        }
        else
        {
            if (cinemaIds != null)
            {
                query = query.Where(od => cinemaIds.Contains(od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaId));
            }

            if (movieIds != null)
            {
                query = query.Where(od => movieIds.Contains(od.MovieScheduleInfoEntity.MovieId));
            }
        }

        return query;
    }
}
