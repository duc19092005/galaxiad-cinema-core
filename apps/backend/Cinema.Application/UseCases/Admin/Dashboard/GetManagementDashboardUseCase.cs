using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Application.Interfaces;
using Cinema.Domain.Entities.AuditLogs;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Admin.Dashboard;

public class GetManagementDashboardUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserContextService _userContextService;

    public GetManagementDashboardUseCase(IUnitOfWork unitOfWork, IUserContextService userContextService)
    {
        _unitOfWork = unitOfWork;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<ManagementDashboardDto>> ExecuteAsync(Guid? cinemaId = null)
    {
        var userId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");
        var isFacilitiesManager = _userContextService.IsInRole("FacilitiesManager");
        var isTheaterManager = _userContextService.IsInRole("TheaterManager");
        var isMovieManager = _userContextService.IsInRole("MovieManager");

        var cinemaIdsQuery = Query<CinemaInfoEntity>().AsNoTracking().Select(c => c.CinemaId);
        if (!isAdmin && (isFacilitiesManager || isTheaterManager))
        {
            cinemaIdsQuery = Query<CinemaInfoEntity>()
                .AsNoTracking()
                .Where(c =>
                    (isFacilitiesManager && c.FacilitiesManagerId == userId) ||
                    (isTheaterManager && c.TheaterManagerId == userId))
                .Select(c => c.CinemaId);
        }
        if (cinemaId.HasValue)
        {
            cinemaIdsQuery = cinemaIdsQuery.Where(id => id == cinemaId.Value);
        }

        var movieIdsQuery = Query<MovieInfoEntity>().AsNoTracking().Select(m => m.MovieId);
        if (!isAdmin && isMovieManager)
        {
            movieIdsQuery = Query<MovieInfoEntity>()
                .AsNoTracking()
                .Where(m => m.MovieManagerId == userId)
                .Select(m => m.MovieId);
        }

        var paidStatuses = new[] { OrderStatusEnum.Booked, OrderStatusEnum.Completed };
        var vietnamTimeZone = GetVietnamTimeZone();
        var vietnamToday = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone).Date;
        var today = TimeZoneInfo.ConvertTimeToUtc(vietnamToday, vietnamTimeZone);
        var tomorrow = TimeZoneInfo.ConvertTimeToUtc(vietnamToday.AddDays(1), vietnamTimeZone);
        var monthStart = TimeZoneInfo.ConvertTimeToUtc(new DateTime(vietnamToday.Year, vietnamToday.Month, 1), vietnamTimeZone);
        var lastSevenDaysStart = TimeZoneInfo.ConvertTimeToUtc(vietnamToday.AddDays(-6), vietnamTimeZone);

        var activeUsers = isAdmin && !cinemaId.HasValue
            ? await Query<UserInfoEntity>().AsNoTracking().CountAsync(u => u.AccountStatus == AccountStatusEnum.Active)
            : 0;

        var totalCinemasQuery = Query<CinemaInfoEntity>().AsNoTracking().Where(c => !c.IsDeleted);
        if (cinemaId.HasValue) totalCinemasQuery = totalCinemasQuery.Where(c => c.CinemaId == cinemaId.Value);
        else if (!isAdmin) totalCinemasQuery = totalCinemasQuery.Where(c => cinemaIdsQuery.Contains(c.CinemaId));
        var totalCinemas = await totalCinemasQuery.CountAsync();

        var activeMoviesQuery = Query<MovieInfoEntity>().AsNoTracking().Where(m => !m.IsDeleted && m.IsActive);
        if (cinemaId.HasValue) activeMoviesQuery = activeMoviesQuery.Where(m => m.MovieCinemaEntities.Any(mc => mc.CinemaId == cinemaId.Value));
        else if (!isAdmin && isMovieManager) activeMoviesQuery = activeMoviesQuery.Where(m => movieIdsQuery.Contains(m.MovieId));
        var activeMovies = await activeMoviesQuery.CountAsync();

        var activeSchedulesQuery = Query<MovieScheduleInfoEntity>().AsNoTracking().Where(s => !s.IsDeleted && s.IsActive);
        if (cinemaId.HasValue)
            activeSchedulesQuery = activeSchedulesQuery.Where(s => s.AuditoriumInfoEntities!.CinemaId == cinemaId.Value);
        else
        {
            if (!isAdmin && (isFacilitiesManager || isTheaterManager))
                activeSchedulesQuery = activeSchedulesQuery.Where(s => cinemaIdsQuery.Contains(s.AuditoriumInfoEntities!.CinemaId));
            if (!isAdmin && isMovieManager)
                activeSchedulesQuery = activeSchedulesQuery.Where(s => movieIdsQuery.Contains(s.MovieId));
        }
        var activeSchedules = await activeSchedulesQuery.CountAsync();

        var orderDetailsQuery = Query<OrderDetailsInfo>().AsNoTracking()
            .Where(od => paidStatuses.Contains(od.OrderInfoEntity.OrderStatus));
        if (cinemaId.HasValue)
            orderDetailsQuery = orderDetailsQuery.Where(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaId == cinemaId.Value);
        else
        {
            if (!isAdmin && (isFacilitiesManager || isTheaterManager))
                orderDetailsQuery = orderDetailsQuery.Where(od => cinemaIdsQuery.Contains(od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaId));
            if (!isAdmin && isMovieManager)
                orderDetailsQuery = orderDetailsQuery.Where(od => movieIdsQuery.Contains(od.MovieScheduleInfoEntity.MovieId));
        }

        var paidOrdersQuery = Query<OrderInfoEntity>().AsNoTracking().Where(o => paidStatuses.Contains(o.OrderStatus));
        if (cinemaId.HasValue)
            paidOrdersQuery = paidOrdersQuery.Where(o => o.OrderDetailsInfo.Any(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaId == cinemaId.Value));
        else if (!isAdmin)
            paidOrdersQuery = paidOrdersQuery.Where(o => o.OrderDetailsInfo.Any(od =>
                ((isFacilitiesManager || isTheaterManager) && cinemaIdsQuery.Contains(od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaId)) ||
                (isMovieManager && movieIdsQuery.Contains(od.MovieScheduleInfoEntity.MovieId))));

        var totalBookings = await paidOrdersQuery.CountAsync();
        var monthRevenue = await orderDetailsQuery
            .Where(od => od.OrderInfoEntity.OrderDate >= monthStart && od.OrderInfoEntity.OrderDate < tomorrow)
            .SumAsync(od => (decimal?)od.PriceEach) ?? 0;
        var ticketsSoldToday = await orderDetailsQuery.CountAsync(od => od.OrderInfoEntity.OrderDate >= today && od.OrderInfoEntity.OrderDate < tomorrow);
        var revenueToday = await orderDetailsQuery
            .Where(od => od.OrderInfoEntity.OrderDate >= today && od.OrderInfoEntity.OrderDate < tomorrow)
            .SumAsync(od => (decimal?)od.PriceEach) ?? 0;
        var totalTicketsSold = await orderDetailsQuery.CountAsync();

        var recentRevenueRows = await orderDetailsQuery
            .Where(od => od.OrderInfoEntity.OrderDate >= lastSevenDaysStart && od.OrderInfoEntity.OrderDate < tomorrow)
            .Select(od => new { od.OrderInfoEntity.OrderDate, od.PriceEach })
            .ToListAsync();

        var revenueByDayLookup = recentRevenueRows
            .GroupBy(row => TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(row.OrderDate, DateTimeKind.Utc), vietnamTimeZone).Date)
            .ToDictionary(g => g.Key, g => new { Revenue = g.Sum(row => row.PriceEach), TicketCount = g.Count() });

        var revenueByDay = Enumerable.Range(0, 7)
            .Select(offset => vietnamToday.AddDays(-6 + offset))
            .Select(date =>
            {
                revenueByDayLookup.TryGetValue(date, out var stat);
                return new DailyRevenueStatDto
                {
                    Date = DateTime.SpecifyKind(date, DateTimeKind.Unspecified),
                    DateLabel = date.ToString("ddd"),
                    Revenue = stat?.Revenue ?? 0,
                    TicketCount = stat?.TicketCount ?? 0
                };
            }).ToList();

        var orderDatesForHourlyStats = await orderDetailsQuery.Select(od => od.OrderInfoEntity.OrderDate).ToListAsync();
        var ticketsByHour = orderDatesForHourlyStats
            .GroupBy(orderDate => TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(orderDate, DateTimeKind.Utc), vietnamTimeZone).Hour)
            .Select(g => new HourlyTicketStatDto { Hour = g.Key, HourLabel = $"{g.Key:00}:00", TicketsSold = g.Count() })
            .OrderBy(x => x.Hour).ToList();

        var busiestHour = ticketsByHour.OrderByDescending(x => x.TicketsSold).FirstOrDefault();

        var ticketsByMovie = await orderDetailsQuery
            .GroupBy(od => new { od.MovieScheduleInfoEntity.MovieId, od.MovieScheduleInfoEntity.MovieInfoEntity!.MovieName })
            .Select(g => new MovieTicketStatDto { MovieId = g.Key.MovieId, MovieName = g.Key.MovieName, TicketsSold = g.Count(), Revenue = g.Sum(x => x.PriceEach) })
            .OrderByDescending(x => x.TicketsSold).Take(10).ToListAsync();

        var hotMovies = await orderDetailsQuery
            .GroupBy(od => new { od.MovieScheduleInfoEntity.MovieId, od.MovieScheduleInfoEntity.MovieInfoEntity!.MovieName, od.MovieScheduleInfoEntity.MovieInfoEntity.MovieImageUrl })
            .Select(g => new HotMovieDto { MovieId = g.Key.MovieId, MovieName = g.Key.MovieName, MovieImageUrl = g.Key.MovieImageUrl, TicketsSold = g.Count(), Revenue = g.Sum(x => x.PriceEach) })
            .OrderByDescending(x => x.TicketsSold).Take(8).ToListAsync();

        var recentTransactionsQuery = Query<OrderInfoEntity>().AsNoTracking().Where(o => paidStatuses.Contains(o.OrderStatus));
        if (cinemaId.HasValue)
            recentTransactionsQuery = recentTransactionsQuery.Where(o => o.OrderDetailsInfo.Any(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaId == cinemaId.Value));
        else if (!isAdmin)
            recentTransactionsQuery = recentTransactionsQuery.Where(o => o.OrderDetailsInfo.Any(od =>
                ((isFacilitiesManager || isTheaterManager) && cinemaIdsQuery.Contains(od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaId)) ||
                (isMovieManager && movieIdsQuery.Contains(od.MovieScheduleInfoEntity.MovieId))));

        var recentTransactions = await recentTransactionsQuery
            .OrderByDescending(o => o.OrderDate).Take(8)
            .Select(o => new RecentTransactionDto
            {
                OrderId = o.OrderId,
                OrderDate = DateTime.SpecifyKind(o.OrderDate, DateTimeKind.Utc),
                MovieName = o.OrderDetailsInfo.Select(od => od.MovieScheduleInfoEntity.MovieInfoEntity!.MovieName).FirstOrDefault() ?? "",
                CinemaName = o.OrderDetailsInfo.Select(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaInfoEntity.CinemaName).FirstOrDefault() ?? "",
                TicketCount = o.TotalQuantity,
                TotalPrice = o.TotalPrice,
                CustomerName = o.CustomerName ?? o.CustomerEmail ?? "Guest"
            }).ToListAsync();

        var recentMoviesQuery = Query<MovieInfoEntity>().AsNoTracking().Where(m => !m.IsDeleted);
        if (cinemaId.HasValue) recentMoviesQuery = recentMoviesQuery.Where(m => m.MovieCinemaEntities.Any(mc => mc.CinemaId == cinemaId.Value));
        else if (!isAdmin && isMovieManager) recentMoviesQuery = recentMoviesQuery.Where(m => m.MovieManagerId == userId);

        var recentMovies = await recentMoviesQuery.OrderByDescending(m => m.CreatedAt).Take(8)
            .Select(m => new RecentMovieDto
            {
                MovieId = m.MovieId, MovieName = m.MovieName, MovieImageUrl = m.MovieImageUrl,
                CreatedAt = DateTime.SpecifyKind(m.CreatedAt, DateTimeKind.Utc),
                CreatedBy = Query<UserInfoEntity>().Where(u => u.UserId == m.CreatedByUserId).Select(u => u.UserName).FirstOrDefault() ?? "System"
            }).ToListAsync();

        var recentCinemasQuery = Query<CinemaInfoEntity>().AsNoTracking().Where(c => !c.IsDeleted);
        if (cinemaId.HasValue) recentCinemasQuery = recentCinemasQuery.Where(c => c.CinemaId == cinemaId.Value);
        else if (!isAdmin && (isFacilitiesManager || isTheaterManager)) recentCinemasQuery = recentCinemasQuery.Where(c => cinemaIdsQuery.Contains(c.CinemaId));

        var recentCinemas = await recentCinemasQuery.OrderByDescending(c => c.CreatedAt).Take(8)
            .Select(c => new RecentCinemaDto
            {
                CinemaId = c.CinemaId, CinemaName = c.CinemaName, CinemaLocation = c.CinemaLocation,
                CreatedAt = DateTime.SpecifyKind(c.CreatedAt, DateTimeKind.Utc),
                CreatedBy = Query<UserInfoEntity>().Where(u => u.UserId == c.CreatedByUserId).Select(u => u.UserName).FirstOrDefault() ?? "System"
            }).ToListAsync();

        var recentAuditoriumsQuery = Query<AuditoriumInfoEntities>().AsNoTracking().Where(a => !a.IsDeleted);
        if (cinemaId.HasValue) recentAuditoriumsQuery = recentAuditoriumsQuery.Where(a => a.CinemaId == cinemaId.Value);
        else if (!isAdmin && (isFacilitiesManager || isTheaterManager)) recentAuditoriumsQuery = recentAuditoriumsQuery.Where(a => cinemaIdsQuery.Contains(a.CinemaId));

        var recentAuditoriums = await recentAuditoriumsQuery.OrderByDescending(a => a.CreatedAt).Take(8)
            .Select(a => new RecentAuditoriumDto
            {
                AuditoriumId = a.AuditoriumId, AuditoriumNumber = a.AuditoriumNumber, CinemaName = a.CinemaInfoEntity.CinemaName,
                CreatedAt = DateTime.SpecifyKind(a.CreatedAt, DateTimeKind.Utc),
                CreatedBy = Query<UserInfoEntity>().Where(u => u.UserId == a.CreatedByUserId).Select(u => u.UserName).FirstOrDefault() ?? "System"
            }).ToListAsync();

        var recentActivitiesQuery = Query<AuditLogEntity>().AsNoTracking();
        if (cinemaId.HasValue) recentActivitiesQuery = recentActivitiesQuery.Where(log => log.CinemaId == cinemaId.Value);
        else if (!isAdmin)
            recentActivitiesQuery = recentActivitiesQuery.Where(log =>
                ((isFacilitiesManager || isTheaterManager) && log.CinemaId != null && cinemaIdsQuery.Contains(log.CinemaId.Value)) ||
                (isMovieManager && log.EntityType == "Movie" && log.ActorUserId == userId));

        var recentActivities = await recentActivitiesQuery.OrderByDescending(log => log.CreatedAt).Take(10)
            .Select(log => new AuditLogDto
            {
                AuditLogId = log.AuditLogId, Action = log.Action, EntityType = log.EntityType,
                EntityId = log.EntityId, EntityName = log.EntityName, Description = log.Description,
                ActorUserId = log.ActorUserId, ActorName = log.ActorName, ActorPrimaryRole = log.ActorPrimaryRole,
                IsAdminAction = log.IsAdminAction, CinemaId = log.CinemaId,
                CreatedAt = DateTime.SpecifyKind(log.CreatedAt, DateTimeKind.Utc)
            }).ToListAsync();

        return new BaseResponse<ManagementDashboardDto>
        {
            IsSuccess = true,
            Message = "Get management dashboard successfully.",
            Data = new ManagementDashboardDto
            {
                TicketsSoldToday = ticketsSoldToday,
                RevenueToday = revenueToday,
                TotalTicketsSold = totalTicketsSold,
                ActiveUsers = activeUsers,
                TotalCinemas = totalCinemas,
                ActiveMovies = activeMovies,
                ActiveSchedules = activeSchedules,
                TotalBookings = totalBookings,
                MonthRevenue = monthRevenue,
                BusiestHourLabel = busiestHour?.HourLabel ?? "N/A",
                RevenueByDay = revenueByDay,
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
        try { return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"); }
        catch (TimeZoneNotFoundException) { return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh"); }
    }

    private IQueryable<TEntity> Query<TEntity>() where TEntity : class
        => _unitOfWork.Repository<TEntity>().Query();
}
