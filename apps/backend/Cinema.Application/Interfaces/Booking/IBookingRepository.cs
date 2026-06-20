using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Entities.Vouchers;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.Interfaces.Booking;

public interface IBookingRepository
{
    Task<List<CinemaInfoEntity>> GetActiveCinemasAsync();
    Task<List<CinemaInfoEntity>> GetNearestCinemasAsync();
    Task<List<MovieInfoEntity>> GetActiveMoviesAsync(DateTime nowUtc);
    Task<List<string>> GetCitiesAsync();
    Task<List<MovieGenreInfoEntity>> GetGenresAsync();

    Task<int> GetNowShowingMoviesCountAsync(string? searchParam);
    Task<List<MovieInfoEntity>> GetNowShowingMoviesPagedAsync(string? searchParam, int skip, int take);

    Task<int> GetComingSoonMoviesCountAsync(string? searchParam);
    Task<List<MovieInfoEntity>> GetComingSoonMoviesPagedAsync(string? searchParam, int skip, int take);

    Task<MovieInfoEntity?> GetMovieDetailAsync(Guid movieId);
    Task<List<MovieScheduleInfoEntity>> GetAdvancedSearchSchedulesAsync(DateTime startUtc, DateTime endUtc, DateTime nowUtc, Guid? movieId, Guid? cinemaId);
    Task<List<MovieScheduleInfoEntity>> GetCinemaShowtimesAsync(Guid movieId, string city, DateTime startUtc, DateTime endUtc, DateTime nowUtc);

    Task<MovieScheduleInfoEntity?> GetScheduleForSeatMapAsync(Guid scheduleId);
    Task<List<Guid>> GetOccupiedSeatIdsAsync(Guid scheduleId);

    Task<MovieScheduleInfoEntity?> GetScheduleForPricingAsync(Guid scheduleId);
    Task<List<UserSegmentsInfoEntity>> GetSegmentsAsync(bool hasHighRole);
    Task<List<CinemaSurchargeInfosEntity>> GetCinemaSurchargesAsync(Guid cinemaId, Guid formatId);

    Task<DepartmentEntity?> GetDepartmentBySharedUserIdAsync(Guid userId);
    Task<StaffWorkingLoggerEntity?> GetActiveStaffLoggerAsync(Guid cinemaId);
    Task<UserInfoEntity?> FindUserByEmailAsync(string email);
    Task<MovieScheduleInfoEntity?> GetScheduleByIdAsync(Guid scheduleId);
    Task<List<SeatsInfoEntity>> GetValidSeatsAsync(Guid auditoriumId, List<Guid> seatIds);
    Task<List<Guid>> GetAlreadyBookedSeatsAsync(Guid scheduleId, List<Guid> seatIds);
    Task<CustomerProfileEntity?> GetCustomerProfileAsync(Guid userId);
    Task<UserVoucherEntity?> GetUserVoucherAsync(Guid voucherId, Guid userId);
    Task<UserInfoEntity?> FindUserByIdAsync(Guid userId);

    Task AddOrderAsync(OrderInfoEntity order);
    Task AddOrderDetailsRangeAsync(List<OrderDetailsInfo> details);

    /// <summary>
    /// Commits all pending changes to the database as a single unit.
    /// Should only be called by the repository implementation internally when needed,
    /// or coordinated via ExecuteInTransactionAsync for multi-step operations.
    /// </summary>
    Task SaveChangesAsync();

    /// <summary>
    /// Begins a database transaction. Returns IUnitOfWorkTransaction (Domain abstraction),
    /// hiding all EF Core/persistence details from the Application layer.
    /// </summary>
    Task<IUnitOfWorkTransaction> BeginTransactionAsync();

    Task<OrderInfoEntity?> GetOrderWithDetailsAsync(Guid orderId);
    Task<List<OrderInfoEntity>> GetUserBookingHistoryAsync(Guid userId);
    Task<UserInfoEntity?> GetUserAccountInfoAsync(Guid userId);

    // VnPay callback mutations
    Task<OrderInfoEntity?> GetOrderByIdAsync(Guid orderId);
    Task<CustomerProfileEntity?> GetCustomerProfileWithSegmentAsync(Guid userId);
    Task<int> CountOrderDetailsAsync(Guid orderId);
    Task<UserVoucherEntity?> GetUserVoucherForUsageAsync(Guid voucherId, Guid userId);
}
