using Cinema.Application.Dtos.Admin.Responses;

namespace Cinema.Application.Interfaces.Admin;

public interface IAdminDashboardRepository
{
    Task<int> GetActiveUsersCountAsync();
    Task<int> GetCinemasCountAsync(List<Guid>? cinemaIds);
    Task<int> GetActiveMoviesCountAsync(List<Guid>? movieIds, Guid? cinemaId);
    Task<int> GetActiveSchedulesCountAsync(List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId);
    Task<int> GetPaidOrdersCountAsync(List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId);
    Task<decimal> GetRevenueAsync(DateTime start, DateTime end, List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId);
    Task<(int tickets, decimal revenue)> GetTodayStatsAsync(DateTime start, DateTime end, List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId);
    Task<int> GetTotalTicketsSoldAsync(List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId);
    Task<List<DailyRevenueStatRow>> GetDailyRevenueStatsAsync(DateTime start, DateTime end, List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId);
    Task<List<DateTime>> GetOrderDatesForHourlyStatsAsync(List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId);
    Task<List<MovieTicketStatDto>> GetMovieTicketStatsAsync(List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId);
    Task<List<HotMovieDto>> GetHotMoviesAsync(List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId);
    Task<List<RecentTransactionDto>> GetRecentTransactionsAsync(int take, List<Guid>? cinemaIds, List<Guid>? movieIds, Guid? cinemaId);
    Task<List<RecentMovieDto>> GetRecentMoviesAsync(int take, Guid? cinemaId, Guid? movieManagerUserId);
    Task<List<RecentCinemaDto>> GetRecentCinemasAsync(int take, Guid? cinemaId, List<Guid>? allowedCinemaIds);
    Task<List<RecentAuditoriumDto>> GetRecentAuditoriumsAsync(int take, Guid? cinemaId, List<Guid>? allowedCinemaIds);
    Task<List<AuditLogDto>> GetRecentAuditLogsForDashboardAsync(int take, Guid? cinemaId, List<Guid>? allowedCinemaIds, Guid? movieManagerUserId);
}

public class DailyRevenueStatRow
{
    public DateTime OrderDate { get; set; }
    public decimal PriceEach { get; set; }
}
