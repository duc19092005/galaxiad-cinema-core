using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Application.Dtos.MovieManager.Responses;
using Cinema.Application.Interfaces.Admin;
using Cinema.Domain.Entities.ScheduleJob;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Entities.AuditLogs;
using Cinema.Domain.Enums;

namespace Cinema.Infrastructure.Repositories;

public class AdminRepository : IAdminRepository
{
    private readonly CinemaDbContext _dbContext;

    public AdminRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Schedule Jobs
    public async Task<List<ScheduleJobLogger>> GetScheduleJobsAsync()
    {
        return await _dbContext.Set<ScheduleJobLogger>()
            .OrderByDescending(x => x.StartedTime)
            .ToListAsync();
    }

    // Audit Logs
    public async Task<List<Guid>> GetManagerCinemaIdsAsync(Guid userId, bool isFacilitiesManager, bool isTheaterManager)
    {
        return await _dbContext.Set<CinemaInfoEntity>()
            .Where(c =>
                (isFacilitiesManager && c.FacilitiesManagerId == userId) ||
                (isTheaterManager && c.TheaterManagerId == userId))
            .Select(c => c.CinemaId)
            .ToListAsync();
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

    // Dashboard Stats
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
        var paidStatuses = new[] { OrderStatusEnum.Booked, OrderStatusEnum.Completed };
        var query = _dbContext.Set<OrderDetailsInfo>().AsNoTracking()
            .Where(od => paidStatuses.Contains(od.OrderInfoEntity.OrderStatus) &&
                         od.OrderInfoEntity.OrderDate >= start && od.OrderInfoEntity.OrderDate < end);

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

        return await query.SumAsync(od => (decimal?)od.PriceEach) ?? 0;
    }

    public async Task<(int tickets, decimal revenue)> GetTodayStatsAsync(DateTime start, DateTime end, List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId)
    {
        var paidStatuses = new[] { OrderStatusEnum.Booked, OrderStatusEnum.Completed };
        var query = _dbContext.Set<OrderDetailsInfo>().AsNoTracking()
            .Where(od => paidStatuses.Contains(od.OrderInfoEntity.OrderStatus) &&
                         od.OrderInfoEntity.OrderDate >= start && od.OrderInfoEntity.OrderDate < end);

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

        var tickets = await query.CountAsync();
        var revenue = await query.SumAsync(od => (decimal?)od.PriceEach) ?? 0;
        return (tickets, revenue);
    }

    public async Task<int> GetTotalTicketsSoldAsync(List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId)
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

        return await query.CountAsync();
    }

    public async Task<List<DailyRevenueStatRow>> GetDailyRevenueStatsAsync(DateTime start, DateTime end, List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId)
    {
        var paidStatuses = new[] { OrderStatusEnum.Booked, OrderStatusEnum.Completed };
        var query = _dbContext.Set<OrderDetailsInfo>().AsNoTracking()
            .Where(od => paidStatuses.Contains(od.OrderInfoEntity.OrderStatus) &&
                         od.OrderInfoEntity.OrderDate >= start && od.OrderInfoEntity.OrderDate < end);

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

        return await query
            .Select(od => new DailyRevenueStatRow { OrderDate = od.OrderInfoEntity.OrderDate, PriceEach = od.PriceEach })
            .ToListAsync();
    }

    public async Task<List<DateTime>> GetOrderDatesForHourlyStatsAsync(List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId)
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

        return await query.Select(od => od.OrderInfoEntity.OrderDate).ToListAsync();
    }

    public async Task<List<MovieTicketStatDto>> GetMovieTicketStatsAsync(List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId)
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

        return await query
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

        return await query
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

    // Transfers
    public async Task<List<AdminTransferUserDto>> GetUsersByRoleAsync(Guid roleId)
    {
        return await _dbContext.Set<UserRoleInfoEntity>().AsNoTracking()
            .Where(ur => ur.RoleId == roleId)
            .Select(ur => new AdminTransferUserDto
            {
                UserId = ur.UserId,
                UserEmail = ur.UserInfoEntity.UserEmail,
                UserName = ur.UserInfoEntity.UserName ?? string.Empty
            })
            .ToListAsync();
    }

    public async Task<List<ManagedItemDto>> GetManagedCinemasAsync(Guid? managerUserId, bool filterUnmanaged, bool isFacilities)
    {
        var query = _dbContext.Set<CinemaInfoEntity>().AsNoTracking();
        if (isFacilities)
        {
            if (filterUnmanaged) query = query.Where(c => c.FacilitiesManagerId == null);
            else if (managerUserId.HasValue) query = query.Where(c => c.FacilitiesManagerId == managerUserId.Value);

            return await query.Select(c => new ManagedItemDto
            {
                ItemId = c.CinemaId,
                ItemName = c.CinemaName,
                Description = $"Vị trí: {c.CinemaLocation} (CSVC)",
                ManagerName = c.FacilitiesManager != null ? c.FacilitiesManager.UserName ?? "Chưa có quản lý CSVC" : "Chưa có quản lý CSVC"
            }).ToListAsync();
        }
        else
        {
            if (filterUnmanaged) query = query.Where(c => c.TheaterManagerId == null);
            else if (managerUserId.HasValue) query = query.Where(c => c.TheaterManagerId == managerUserId.Value);

            return await query.Select(c => new ManagedItemDto
            {
                ItemId = c.CinemaId,
                ItemName = c.CinemaName,
                Description = $"Vị trí: {c.CinemaLocation} (Vận hành)",
                ManagerName = c.TheaterManager != null ? c.TheaterManager.UserName ?? "Chưa có quản lý vận hành" : "Chưa có quản lý vận hành"
            }).ToListAsync();
        }
    }

    public async Task<List<ManagedItemDto>> GetManagedMoviesAsync(Guid? managerUserId, bool filterUnmanaged)
    {
        var query = _dbContext.Set<MovieInfoEntity>().AsNoTracking();
        if (filterUnmanaged) query = query.Where(m => m.MovieManagerId == null);
        else if (managerUserId.HasValue) query = query.Where(m => m.MovieManagerId == managerUserId.Value);

        return await query.Select(m => new ManagedItemDto
        {
            ItemId = m.MovieId,
            ItemName = m.MovieName,
            Description = $"Đạo diễn: {m.Director}",
            ManagerName = m.MovieManager != null ? m.MovieManager.UserName ?? "Chưa có quản lý" : "Chưa có quản lý"
        }).ToListAsync();
    }

    public async Task<List<CinemaInfoEntity>> GetCinemasByManagerOrIdAsync(Guid? managerUserId, Guid? cinemaId, bool isFacilities)
    {
        var query = _dbContext.Set<CinemaInfoEntity>().AsQueryable();
        if (cinemaId.HasValue)
        {
            query = query.Where(c => c.CinemaId == cinemaId.Value);
        }
        else if (managerUserId.HasValue)
        {
            if (isFacilities) query = query.Where(c => c.FacilitiesManagerId == managerUserId.Value);
            else query = query.Where(c => c.TheaterManagerId == managerUserId.Value);
        }
        return await query.ToListAsync();
    }

    public async Task<List<MovieInfoEntity>> GetMoviesByManagerOrIdAsync(Guid? managerUserId, Guid? movieId)
    {
        var query = _dbContext.Set<MovieInfoEntity>().AsQueryable();
        if (movieId.HasValue)
        {
            query = query.Where(m => m.MovieId == movieId.Value);
        }
        else if (managerUserId.HasValue)
        {
            query = query.Where(m => m.MovieManagerId == managerUserId.Value);
        }
        return await query.ToListAsync();
    }

    // Movie Manager
    public async Task<List<ResGetMovieInfosMovieManagerDto>> GetMovieInfosAsync(Guid? currentUserId, bool isAdmin, Guid? cinemaId)
    {
        var query = _dbContext.Set<MovieInfoEntity>().AsQueryable();
        // Cả Movie Manager và Admin đều được xem tất cả phim, không lọc theo manager hay rạp nữa
        return await query
            .Select(x => new ResGetMovieInfosMovieManagerDto
            {
                MovieId = x.MovieId,
                MovieDescriptions = x.MovieDescription,
                MovieGenresInfos = x.MovieGenreMovieInfoEntity.Select(y => y.MovieGenreInfoEntity.MovieGenreName).ToList(),
                MovieImageUrl = x.MovieImageUrl,
                MovieBannerUrl = x.MovieBannerUrl,
                MovieName = x.MovieName,
                MovieVisualFormatInfos = x.MovieFormatMovieInfoEntity.Select(y => y.MovieFormatInfoEntity.MovieFormatName).ToList(),
                MovieCinemas = _dbContext.Set<MovieCinemaEntity>()
                    .Where(mc => mc.MovieId == x.MovieId)
                    .Select(mc => new ResMovieCinemaDto { CinemaId = mc.CinemaId, CinemaName = mc.CinemaInfoEntity.CinemaName })
                    .ToList(),
                Duration = x.MovieDuration,
                EndedDate = DateTime.SpecifyKind(x.EndedDate, DateTimeKind.Utc),
                StartedDate = DateTime.SpecifyKind(x.ActiveAt, DateTimeKind.Utc),
                CreatedAt = DateTime.SpecifyKind(x.CreatedAt, DateTimeKind.Utc),
                UpdatedAt = DateTime.SpecifyKind(x.UpdatedAt, DateTimeKind.Utc),
                CreatedBy = _dbContext.Set<UserInfoEntity>()
                    .Where(u => u.UserId == x.CreatedByUserId)
                    .Select(u => u.UserName)
                    .FirstOrDefault() ?? "System Administrator",
                UpdatedBy = x.UpdatedByUserId != null
                    ? _dbContext.Set<UserInfoEntity>()
                        .Where(u => u.UserId == x.UpdatedByUserId)
                        .Select(u => u.UserName)
                        .FirstOrDefault() ?? ""
                    : "",
                TrailerUrl = x.TrailerUrl,
                Director = x.Director,
                Actors = x.Actors,
                MovieRequiredAgeSymbol = x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.Trim(),
                MovieManagerName = x.MovieManager != null ? x.MovieManager.UserName : "Chưa có"
            })
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<ResGetMovieInfosMovieManagerDto?> GetMovieInfoByIdAsync(Guid movieId, Guid? currentUserId, bool isAdmin)
    {
        var query = _dbContext.Set<MovieInfoEntity>().Where(x => x.MovieId == movieId);
        return await query
            .Select(m => new ResGetMovieInfosMovieManagerDto
            {
                MovieId = m.MovieId,
                MovieDescriptions = m.MovieDescription,
                MovieGenresInfos = m.MovieGenreMovieInfoEntity.Select(y => y.MovieGenreInfoEntity.MovieGenreName).ToList(),
                MovieImageUrl = m.MovieImageUrl,
                MovieName = m.MovieName,
                MovieVisualFormatInfos = m.MovieFormatMovieInfoEntity.Select(y => y.MovieFormatInfoEntity.MovieFormatName).ToList(),
                MovieCinemas = _dbContext.Set<MovieCinemaEntity>()
                    .Where(mc => mc.MovieId == m.MovieId)
                    .Select(mc => new ResMovieCinemaDto { CinemaId = mc.CinemaId, CinemaName = mc.CinemaInfoEntity.CinemaName })
                    .ToList(),
                Duration = m.MovieDuration,
                EndedDate = DateTime.SpecifyKind(m.EndedDate, DateTimeKind.Utc),
                StartedDate = DateTime.SpecifyKind(m.ActiveAt, DateTimeKind.Utc),
                CreatedAt = DateTime.SpecifyKind(m.CreatedAt, DateTimeKind.Utc),
                UpdatedAt = DateTime.SpecifyKind(m.UpdatedAt, DateTimeKind.Utc),
                CreatedBy = _dbContext.Set<UserInfoEntity>()
                    .Where(u => u.UserId == m.CreatedByUserId)
                    .Select(u => u.UserName)
                    .FirstOrDefault() ?? "System Administrator",
                UpdatedBy = m.UpdatedByUserId != null
                    ? _dbContext.Set<UserInfoEntity>()
                        .Where(u => u.UserId == m.UpdatedByUserId)
                        .Select(u => u.UserName)
                        .FirstOrDefault() ?? ""
                    : "",
                TrailerUrl = m.TrailerUrl,
                Director = m.Director,
                Actors = m.Actors,
                MovieRequiredAgeSymbol = m.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.Trim(),
                MovieManagerName = m.MovieManager != null ? m.MovieManager.UserName : "Chưa có"
            })
            .FirstOrDefaultAsync();
    }

    public async Task<MovieInfoEntity?> GetMovieInfoEntityAsync(Guid movieId)
    {
        return await _dbContext.Set<MovieInfoEntity>().FirstOrDefaultAsync(x => x.MovieId == movieId);
    }

    public async Task<bool> HasSuccessfulBookingAsync(Guid movieId)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleInfoEntity.MovieId == movieId &&
                            od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked);
    }

    public async Task<bool> HasAnyBookingAsync(Guid movieId)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleInfoEntity.MovieId == movieId);
    }

    public async Task<List<movieFormatMovieInfoEntity>> GetMovieFormatsByMovieIdAsync(Guid movieId)
    {
        return await _dbContext.Set<movieFormatMovieInfoEntity>().Where(x => x.MovieId == movieId).ToListAsync();
    }

    public async Task<List<MovieGenreMovieInfoEntity>> GetMovieGenresByMovieIdAsync(Guid movieId)
    {
        return await _dbContext.Set<MovieGenreMovieInfoEntity>().Where(x => x.MovieId == movieId).ToListAsync();
    }

    public async Task<List<MovieCinemaEntity>> GetMovieCinemasByMovieIdAsync(Guid movieId)
    {
        return await _dbContext.Set<MovieCinemaEntity>().Where(x => x.MovieId == movieId).ToListAsync();
    }

    public async Task AddMovieAsync(MovieInfoEntity movie)
    {
        await _dbContext.Set<MovieInfoEntity>().AddAsync(movie);
    }

    public async Task AddMovieFormatsAsync(IEnumerable<movieFormatMovieInfoEntity> formats)
    {
        await _dbContext.Set<movieFormatMovieInfoEntity>().AddRangeAsync(formats);
    }

    public async Task AddMovieGenresAsync(IEnumerable<MovieGenreMovieInfoEntity> genres)
    {
        await _dbContext.Set<MovieGenreMovieInfoEntity>().AddRangeAsync(genres);
    }

    public async Task AddMovieCinemasAsync(IEnumerable<MovieCinemaEntity> cinemas)
    {
        await _dbContext.Set<MovieCinemaEntity>().AddRangeAsync(cinemas);
    }

    public void RemoveMovieFormats(IEnumerable<movieFormatMovieInfoEntity> formats)
    {
        _dbContext.Set<movieFormatMovieInfoEntity>().RemoveRange(formats);
    }

    public void RemoveMovieGenres(IEnumerable<MovieGenreMovieInfoEntity> genres)
    {
        _dbContext.Set<MovieGenreMovieInfoEntity>().RemoveRange(genres);
    }

    public void RemoveMovieCinemas(IEnumerable<MovieCinemaEntity> cinemas)
    {
        _dbContext.Set<MovieCinemaEntity>().RemoveRange(cinemas);
    }

    public void RemoveMovie(MovieInfoEntity movie)
    {
        _dbContext.Set<MovieInfoEntity>().Remove(movie);
    }

    public void UpdateMovie(MovieInfoEntity movie)
    {
        _dbContext.Set<MovieInfoEntity>().Update(movie);
    }

    public async Task HardDeleteMovieAsync(Guid movieId)
    {
        var schedules = await _dbContext.Set<MovieScheduleInfoEntity>().Where(x => x.MovieId == movieId).ToListAsync();
        _dbContext.Set<MovieScheduleInfoEntity>().RemoveRange(schedules);

        var movieFormats = await _dbContext.Set<movieFormatMovieInfoEntity>().Where(x => x.MovieId == movieId).ToListAsync();
        _dbContext.Set<movieFormatMovieInfoEntity>().RemoveRange(movieFormats);

        var movieGenres = await _dbContext.Set<MovieGenreMovieInfoEntity>().Where(x => x.MovieId == movieId).ToListAsync();
        _dbContext.Set<MovieGenreMovieInfoEntity>().RemoveRange(movieGenres);

        var movieCinemas = await _dbContext.Set<MovieCinemaEntity>().Where(x => x.MovieId == movieId).ToListAsync();
        _dbContext.Set<MovieCinemaEntity>().RemoveRange(movieCinemas);

        var movie = await _dbContext.Set<MovieInfoEntity>().FindAsync(movieId);
        if (movie != null)
        {
            _dbContext.Set<MovieInfoEntity>().Remove(movie);
        }
    }

    public async Task<bool> IsMovieNameExistsAsync(string name, Guid? excludeMovieId)
    {
        if (excludeMovieId != null)
        {
            return await _dbContext.Set<MovieInfoEntity>().AnyAsync(x =>
                x.MovieName == name && x.MovieId != excludeMovieId && !x.IsDeleted);
        }
        else
        {
            return await _dbContext.Set<MovieInfoEntity>().AnyAsync(x =>
                x.MovieName == name && !x.IsDeleted);
        }
    }

    public async Task<bool> IsMovieDescriptionExistsAsync(string description, Guid? excludeMovieId)
    {
        if (excludeMovieId != null)
        {
            return await _dbContext.Set<MovieInfoEntity>().AnyAsync(x =>
                x.MovieDescription == description && x.MovieId != excludeMovieId
                                                        && !x.IsDeleted);
        }
        else
        {
            return await _dbContext.Set<MovieInfoEntity>().AnyAsync(x =>
                x.MovieDescription == description
                && !x.IsDeleted);
        }
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
