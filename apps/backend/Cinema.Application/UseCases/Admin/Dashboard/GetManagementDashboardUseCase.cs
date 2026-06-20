using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Admin;

namespace Cinema.Application.UseCases.Admin.Dashboard;

public class GetManagementDashboardUseCase
{
    private readonly IAdminRepository _adminRepository;
    private readonly IUserContextService _userContextService;

    public GetManagementDashboardUseCase(IAdminRepository adminRepository, IUserContextService userContextService)
    {
        _adminRepository = adminRepository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<ManagementDashboardDto>> ExecuteAsync(Guid? cinemaId = null)
    {
        var userId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");
        var isFacilitiesManager = _userContextService.IsInRole("FacilitiesManager");
        var isTheaterManager = _userContextService.IsInRole("TheaterManager");
        var isMovieManager = _userContextService.IsInRole("MovieManager");

        List<Guid>? allowedCinemaIds = null;
        if (!isAdmin && (isFacilitiesManager || isTheaterManager))
        {
            allowedCinemaIds = await _adminRepository.GetManagerCinemaIdsAsync(userId, isFacilitiesManager, isTheaterManager);
        }

        List<Guid>? movieIds = null;
        Guid? movieManagerUserId = null;
        if (!isAdmin && isMovieManager)
        {
            movieManagerUserId = userId;
            var managedMovies = await _adminRepository.GetMoviesByManagerOrIdAsync(userId, null);
            movieIds = managedMovies.Select(m => m.MovieId).ToList();
        }

        var vietnamTimeZone = GetVietnamTimeZone();
        var vietnamToday = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone).Date;
        var today = TimeZoneInfo.ConvertTimeToUtc(vietnamToday, vietnamTimeZone);
        var tomorrow = TimeZoneInfo.ConvertTimeToUtc(vietnamToday.AddDays(1), vietnamTimeZone);
        var monthStart = TimeZoneInfo.ConvertTimeToUtc(new DateTime(vietnamToday.Year, vietnamToday.Month, 1), vietnamTimeZone);
        var lastSevenDaysStart = TimeZoneInfo.ConvertTimeToUtc(vietnamToday.AddDays(-6), vietnamTimeZone);

        var activeUsers = isAdmin && !cinemaId.HasValue
            ? await _adminRepository.GetActiveUsersCountAsync()
            : 0;

        var totalCinemas = await _adminRepository.GetCinemasCountAsync(cinemaId.HasValue ? new List<Guid> { cinemaId.Value } : allowedCinemaIds);

        var activeMovies = await _adminRepository.GetActiveMoviesCountAsync(movieIds, cinemaId);

        var activeSchedules = await _adminRepository.GetActiveSchedulesCountAsync(allowedCinemaIds, movieIds, cinemaId);

        var totalBookings = await _adminRepository.GetPaidOrdersCountAsync(allowedCinemaIds, movieIds, cinemaId);

        var monthRevenue = await _adminRepository.GetRevenueAsync(monthStart, tomorrow, allowedCinemaIds, movieIds, cinemaId);

        var (ticketsSoldToday, revenueToday) = await _adminRepository.GetTodayStatsAsync(today, tomorrow, allowedCinemaIds, movieIds, cinemaId);

        var totalTicketsSold = await _adminRepository.GetTotalTicketsSoldAsync(allowedCinemaIds, movieIds, cinemaId);

        var recentRevenueRows = await _adminRepository.GetDailyRevenueStatsAsync(lastSevenDaysStart, tomorrow, allowedCinemaIds, movieIds, cinemaId);

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

        var orderDatesForHourlyStats = await _adminRepository.GetOrderDatesForHourlyStatsAsync(allowedCinemaIds, movieIds, cinemaId);
        var ticketsByHour = orderDatesForHourlyStats
            .GroupBy(orderDate => TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(orderDate, DateTimeKind.Utc), vietnamTimeZone).Hour)
            .Select(g => new HourlyTicketStatDto { Hour = g.Key, HourLabel = $"{g.Key:00}:00", TicketsSold = g.Count() })
            .OrderBy(x => x.Hour).ToList();

        var busiestHour = ticketsByHour.OrderByDescending(x => x.TicketsSold).FirstOrDefault();

        var ticketsByMovie = await _adminRepository.GetMovieTicketStatsAsync(allowedCinemaIds, movieIds, cinemaId);

        var hotMovies = await _adminRepository.GetHotMoviesAsync(allowedCinemaIds, movieIds, cinemaId);

        var recentTransactions = await _adminRepository.GetRecentTransactionsAsync(8, allowedCinemaIds, movieIds, cinemaId);

        var recentMovies = await _adminRepository.GetRecentMoviesAsync(8, cinemaId, movieManagerUserId);

        var recentCinemas = await _adminRepository.GetRecentCinemasAsync(8, cinemaId, allowedCinemaIds);

        var recentAuditoriums = await _adminRepository.GetRecentAuditoriumsAsync(8, cinemaId, allowedCinemaIds);

        var recentActivities = await _adminRepository.GetRecentAuditLogsForDashboardAsync(10, cinemaId, allowedCinemaIds, movieManagerUserId);

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
}
