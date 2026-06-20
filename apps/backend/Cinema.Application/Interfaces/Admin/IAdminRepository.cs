using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Admin.Responses;
using Cinema.Application.Dtos.MovieManager.Responses;
using Cinema.Domain.Entities.ScheduleJob;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.AuditLogs;

namespace Cinema.Application.Interfaces.Admin;

public interface IAdminRepository
{
    // Schedule Jobs
    Task<List<ScheduleJobLogger>> GetScheduleJobsAsync();

    // Audit Logs
    Task<List<Guid>> GetManagerCinemaIdsAsync(Guid userId, bool isFacilitiesManager, bool isTheaterManager);
    Task<List<AuditLogDto>> GetRecentAuditLogsAsync(int take, List<Guid>? cinemaIds, Guid? movieManagerUserId);

    // Dashboard Stats
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

    // Transfers
    Task<List<AdminTransferUserDto>> GetUsersByRoleAsync(Guid roleId);
    Task<List<ManagedItemDto>> GetManagedCinemasAsync(Guid? managerUserId, bool filterUnmanaged, bool isFacilities);
    Task<List<ManagedItemDto>> GetManagedMoviesAsync(Guid? managerUserId, bool filterUnmanaged);
    Task<List<CinemaInfoEntity>> GetCinemasByManagerOrIdAsync(Guid? managerUserId, Guid? cinemaId, bool isFacilities);
    Task<List<MovieInfoEntity>> GetMoviesByManagerOrIdAsync(Guid? managerUserId, Guid? movieId);

    // Movie Manager
    Task<List<ResGetMovieInfosMovieManagerDto>> GetMovieInfosAsync(Guid? currentUserId, bool isAdmin, Guid? cinemaId);
    Task<ResGetMovieInfosMovieManagerDto?> GetMovieInfoByIdAsync(Guid movieId, Guid? currentUserId, bool isAdmin);
    Task<MovieInfoEntity?> GetMovieInfoEntityAsync(Guid movieId);
    Task<bool> HasSuccessfulBookingAsync(Guid movieId);
    Task<bool> HasAnyBookingAsync(Guid movieId);
    Task<List<movieFormatMovieInfoEntity>> GetMovieFormatsByMovieIdAsync(Guid movieId);
    Task<List<MovieGenreMovieInfoEntity>> GetMovieGenresByMovieIdAsync(Guid movieId);
    Task<List<MovieCinemaEntity>> GetMovieCinemasByMovieIdAsync(Guid movieId);
    Task AddMovieAsync(MovieInfoEntity movie);
    Task AddMovieFormatsAsync(IEnumerable<movieFormatMovieInfoEntity> formats);
    Task AddMovieGenresAsync(IEnumerable<MovieGenreMovieInfoEntity> genres);
    Task AddMovieCinemasAsync(IEnumerable<MovieCinemaEntity> cinemas);
    void RemoveMovieFormats(IEnumerable<movieFormatMovieInfoEntity> formats);
    void RemoveMovieGenres(IEnumerable<MovieGenreMovieInfoEntity> genres);
    void RemoveMovieCinemas(IEnumerable<MovieCinemaEntity> cinemas);
    void RemoveMovie(MovieInfoEntity movie);
    void UpdateMovie(MovieInfoEntity movie);
    Task HardDeleteMovieAsync(Guid movieId);

    // Common
    Task<bool> IsMovieNameExistsAsync(string name, Guid? excludeMovieId);
    Task<bool> IsMovieDescriptionExistsAsync(string description, Guid? excludeMovieId);
    Task SaveChangesAsync();
}

public class DailyRevenueStatRow
{
    public DateTime OrderDate { get; set; }
    public decimal PriceEach { get; set; }
}
