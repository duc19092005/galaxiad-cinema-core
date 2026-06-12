using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Admin.Responses;
using BusinessLayer.Services.IdentityAccess;
using DataAccess;
using Microsoft.EntityFrameworkCore;
using Shared.Enums;

namespace BusinessLayer.Services.Admin.Dashboard;

public class ManagementDashboardService
{
    private readonly CinemaDbContext _dbContext;
    private readonly IUserContextService _userContextService;

    public ManagementDashboardService(CinemaDbContext dbContext, IUserContextService userContextService)
    {
        _dbContext = dbContext;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<ManagementDashboardDto>> GetDashboardAsync()
    {
        var userId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");
        var isFacilitiesManager = _userContextService.IsInRole("FacilitiesManager");
        var isTheaterManager = _userContextService.IsInRole("TheaterManager");
        var isMovieManager = _userContextService.IsInRole("MovieManager");

        var cinemaIdsQuery = _dbContext.CinemaInfoEntity.AsNoTracking().Select(c => c.CinemaId);
        if (!isAdmin && (isFacilitiesManager || isTheaterManager))
        {
            cinemaIdsQuery = _dbContext.CinemaInfoEntity
                .AsNoTracking()
                .Where(c =>
                    (isFacilitiesManager && c.FacilitiesManagerId == userId) ||
                    (isTheaterManager && c.TheaterManagerId == userId))
                .Select(c => c.CinemaId);
        }

        var movieIdsQuery = _dbContext.MovieInfoEntity.AsNoTracking().Select(m => m.MovieId);
        if (!isAdmin && isMovieManager)
        {
            movieIdsQuery = _dbContext.MovieInfoEntity
                .AsNoTracking()
                .Where(m => m.MovieManagerId == userId)
                .Select(m => m.MovieId);
        }

        var paidStatuses = new[] { OrderStatusEnum.Booked, OrderStatusEnum.Completed };
        var vietnamTimeZone = GetVietnamTimeZone();
        var vietnamToday = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone).Date;
        var today = TimeZoneInfo.ConvertTimeToUtc(vietnamToday, vietnamTimeZone);
        var tomorrow = TimeZoneInfo.ConvertTimeToUtc(vietnamToday.AddDays(1), vietnamTimeZone);

        var orderDetailsQuery = _dbContext.OrderDetailsInfoEntity
            .AsNoTracking()
            .Where(od => paidStatuses.Contains(od.OrderInfoEntity.OrderStatus));

        if (!isAdmin && (isFacilitiesManager || isTheaterManager))
        {
            orderDetailsQuery = orderDetailsQuery.Where(od =>
                cinemaIdsQuery.Contains(od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaId));
        }

        if (!isAdmin && isMovieManager)
        {
            orderDetailsQuery = orderDetailsQuery.Where(od =>
                movieIdsQuery.Contains(od.MovieScheduleInfoEntity.MovieId));
        }

        var ticketsSoldToday = await orderDetailsQuery.CountAsync(od =>
            od.OrderInfoEntity.OrderDate >= today && od.OrderInfoEntity.OrderDate < tomorrow);

        var revenueToday = await orderDetailsQuery
            .Where(od => od.OrderInfoEntity.OrderDate >= today && od.OrderInfoEntity.OrderDate < tomorrow)
            .SumAsync(od => (decimal?)od.PriceEach) ?? 0;

        var totalTicketsSold = await orderDetailsQuery.CountAsync();

        var orderDatesForHourlyStats = await orderDetailsQuery
            .Select(od => od.OrderInfoEntity.OrderDate)
            .ToListAsync();

        var ticketsByHour = orderDatesForHourlyStats
            .GroupBy(orderDate => TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(orderDate, DateTimeKind.Utc), vietnamTimeZone).Hour)
            .Select(g => new HourlyTicketStatDto
            {
                Hour = g.Key,
                HourLabel = $"{g.Key:00}:00",
                TicketsSold = g.Count()
            })
            .OrderBy(x => x.Hour)
            .ToList();

        var busiestHour = ticketsByHour
            .OrderByDescending(x => x.TicketsSold)
            .FirstOrDefault();

        var ticketsByMovie = await orderDetailsQuery
            .GroupBy(od => new
            {
                od.MovieScheduleInfoEntity.MovieId,
                od.MovieScheduleInfoEntity.MovieInfoEntity!.MovieName
            })
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

        var hotMovies = await orderDetailsQuery
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

        var recentTransactions = await _dbContext.OrderInfoEntity
            .AsNoTracking()
            .Where(o => paidStatuses.Contains(o.OrderStatus))
            .Where(o => isAdmin ||
                o.OrderDetailsInfo.Any(od =>
                    ((isFacilitiesManager || isTheaterManager) && cinemaIdsQuery.Contains(od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaId)) ||
                    (isMovieManager && movieIdsQuery.Contains(od.MovieScheduleInfoEntity.MovieId))))
            .OrderByDescending(o => o.OrderDate)
            .Take(8)
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

        var recentMoviesQuery = _dbContext.MovieInfoEntity.AsNoTracking().Where(m => !m.IsDeleted);
        if (!isAdmin && isMovieManager)
        {
            recentMoviesQuery = recentMoviesQuery.Where(m => m.MovieManagerId == userId);
        }

        var recentMovies = await recentMoviesQuery
            .OrderByDescending(m => m.CreatedAt)
            .Take(8)
            .Select(m => new RecentMovieDto
            {
                MovieId = m.MovieId,
                MovieName = m.MovieName,
                MovieImageUrl = m.MovieImageUrl,
                CreatedAt = DateTime.SpecifyKind(m.CreatedAt, DateTimeKind.Utc),
                CreatedBy = m.Creator != null ? m.Creator.UserName ?? "System" : "System"
            })
            .ToListAsync();

        var recentCinemasQuery = _dbContext.CinemaInfoEntity.AsNoTracking().Where(c => !c.IsDeleted);
        if (!isAdmin && (isFacilitiesManager || isTheaterManager))
        {
            recentCinemasQuery = recentCinemasQuery.Where(c => cinemaIdsQuery.Contains(c.CinemaId));
        }

        var recentCinemas = await recentCinemasQuery
            .OrderByDescending(c => c.CreatedAt)
            .Take(8)
            .Select(c => new RecentCinemaDto
            {
                CinemaId = c.CinemaId,
                CinemaName = c.CinemaName,
                CinemaLocation = c.CinemaLocation,
                CreatedAt = DateTime.SpecifyKind(c.CreatedAt, DateTimeKind.Utc),
                CreatedBy = c.Creator != null ? c.Creator.UserName ?? "System" : "System"
            })
            .ToListAsync();

        var recentAuditoriumsQuery = _dbContext.AuditoriumInfoEntities.AsNoTracking().Where(a => !a.IsDeleted);
        if (!isAdmin && (isFacilitiesManager || isTheaterManager))
        {
            recentAuditoriumsQuery = recentAuditoriumsQuery.Where(a => cinemaIdsQuery.Contains(a.CinemaId));
        }

        var recentAuditoriums = await recentAuditoriumsQuery
            .OrderByDescending(a => a.CreatedAt)
            .Take(8)
            .Select(a => new RecentAuditoriumDto
            {
                AuditoriumId = a.AuditoriumId,
                AuditoriumNumber = a.AuditoriumNumber,
                CinemaName = a.CinemaInfoEntity.CinemaName,
                CreatedAt = DateTime.SpecifyKind(a.CreatedAt, DateTimeKind.Utc),
                CreatedBy = a.Creator != null ? a.Creator.UserName ?? "System" : "System"
            })
            .ToListAsync();

        var recentActivities = await _dbContext.AuditLogEntity
            .AsNoTracking()
            .Where(log => isAdmin ||
                ((isFacilitiesManager || isTheaterManager) && log.CinemaId != null && cinemaIdsQuery.Contains(log.CinemaId.Value)) ||
                (isMovieManager && log.EntityType == "Movie" && log.ActorUserId == userId))
            .OrderByDescending(log => log.CreatedAt)
            .Take(10)
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

        return new BaseResponse<ManagementDashboardDto>
        {
            IsSuccess = true,
            Message = "Get management dashboard successfully.",
            Data = new ManagementDashboardDto
            {
                TicketsSoldToday = ticketsSoldToday,
                RevenueToday = revenueToday,
                TotalTicketsSold = totalTicketsSold,
                BusiestHourLabel = busiestHour?.HourLabel ?? "N/A",
                RecentTransactions = recentTransactions,
                TicketsByMovie = ticketsByMovie,
                TicketsByHour = ticketsByHour,
                HotMovies = hotMovies,
                RecentMovies = recentMovies,
                RecentCinemas = recentCinemas,
                RecentAuditoriums = recentAuditoriums,
                RecentActivities = recentActivities
            }
        };
    }

    private static TimeZoneInfo GetVietnamTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
        }
    }
}
