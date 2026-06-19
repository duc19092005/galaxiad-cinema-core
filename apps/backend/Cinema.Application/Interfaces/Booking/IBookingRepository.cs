using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Entities.Vouchers;

namespace Cinema.Application.Interfaces.Booking;

public interface IBookingTransaction : IAsyncDisposable
{
    Task CommitAsync();
    Task RollbackAsync();
}

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
    Task SaveChangesAsync();
    Task<IBookingTransaction> BeginTransactionAsync();
    
    Task<OrderInfoEntity?> GetOrderWithDetailsAsync(Guid orderId);
    Task<List<OrderInfoEntity>> GetUserBookingHistoryAsync(Guid userId);
    Task<UserInfoEntity?> GetUserAccountInfoAsync(Guid userId);
    
    // VnPay callback mutations
    Task<OrderInfoEntity?> GetOrderByIdAsync(Guid orderId);
    Task<CustomerProfileEntity?> GetCustomerProfileWithSegmentAsync(Guid userId);
    Task<int> CountOrderDetailsAsync(Guid orderId);
    Task<UserVoucherEntity?> GetUserVoucherForUsageAsync(Guid voucherId, Guid userId);
}
