using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Entities.Vouchers;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Interfaces.Persistence;
using Microsoft.EntityFrameworkCore;
using Cinema.Domain.Enums;


namespace Cinema.Infrastructure.Repositories;

public class BookingRepository : IBookingRepository
{
    private readonly CinemaDbContext _dbContext;

    public BookingRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<CinemaInfoEntity>> GetActiveCinemasAsync()
    {
        return await _dbContext.Set<CinemaInfoEntity>()
            .Where(c => !c.IsDeleted && c.IsActive)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<CinemaInfoEntity>> GetNearestCinemasAsync()
    {
        return await _dbContext.Set<CinemaInfoEntity>()
            .Where(c => !c.IsDeleted && c.IsActive)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<MovieInfoEntity>> GetActiveMoviesAsync(DateTime nowUtc)
    {
        return await _dbContext.Set<MovieInfoEntity>()
            .Where(m => m.IsActive && !m.IsDeleted && m.EndedDate > nowUtc)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<string>> GetCitiesAsync()
    {
        return await _dbContext.Set<CinemaInfoEntity>()
            .Where(x => !x.IsDeleted)
            .GroupBy(x => x.CinemaCity)
            .Select(g => g.Key)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<MovieGenreInfoEntity>> GetGenresAsync()
    {
        return await _dbContext.Set<MovieGenreInfoEntity>()
            .AsNoTracking()
            .ToListAsync();
    }

    private IQueryable<MovieInfoEntity> BuildNowShowingMoviesQuery(string? searchParam)
    {
        var query = _dbContext.Set<MovieInfoEntity>()
            .Where(x => !x.IsDeleted && x.IsActive && !x.IsCommingSoon);

        if (!string.IsNullOrEmpty(searchParam))
        {
            var kw = searchParam.ToLower();
            if (Guid.TryParse(searchParam, out Guid cId))
            {
                query = query.Where(x => x.MovieScheduleInfoEntity.Any(s => 
                    !s.IsDeleted && s.AuditoriumInfoEntities!.CinemaId == cId));
            }
            else
            {
                query = query.Where(x => 
                    x.MovieName.ToLower().Contains(kw) || 
                    x.MovieScheduleInfoEntity.Any(s => !s.IsDeleted && s.AuditoriumInfoEntities!.CinemaInfoEntity.CinemaName.ToLower().Contains(kw))
                );
            }
        }

        return query;
    }

    public async Task<int> GetNowShowingMoviesCountAsync(string? searchParam)
    {
        return await BuildNowShowingMoviesQuery(searchParam).CountAsync();
    }

    public async Task<List<MovieInfoEntity>> GetNowShowingMoviesPagedAsync(string? searchParam, int skip, int take)
    {
        return await BuildNowShowingMoviesQuery(searchParam)
            .Include(x => x.MovieRequiredAgeEntity)
            .Include(x => x.MovieGenreMovieInfoEntity)
                .ThenInclude(g => g.MovieGenreInfoEntity)
            .Include(x => x.MovieFormatMovieInfoEntity)
                .ThenInclude(f => f.MovieFormatInfoEntity)
            .OrderByDescending(x => x.CreatedAt)
            .Skip(skip)
            .Take(take)
            .AsNoTracking()
            .ToListAsync();
    }

    private IQueryable<MovieInfoEntity> BuildComingSoonMoviesQuery(string? searchParam)
    {
        var query = _dbContext.Set<MovieInfoEntity>()
            .Where(x => !x.IsDeleted && x.IsCommingSoon);

        if (!string.IsNullOrEmpty(searchParam))
        {
            var kw = searchParam.ToLower();
            if (Guid.TryParse(searchParam, out Guid cId))
            {
                query = query.Where(x => x.MovieScheduleInfoEntity.Any(s => 
                    !s.IsDeleted && s.AuditoriumInfoEntities!.CinemaId == cId));
            }
            else
            {
                query = query.Where(x => 
                    x.MovieName.ToLower().Contains(kw) || 
                    x.MovieScheduleInfoEntity.Any(s => !s.IsDeleted && s.AuditoriumInfoEntities!.CinemaInfoEntity.CinemaName.ToLower().Contains(kw))
                );
            }
        }

        return query;
    }

    public async Task<int> GetComingSoonMoviesCountAsync(string? searchParam)
    {
        return await BuildComingSoonMoviesQuery(searchParam).CountAsync();
    }

    public async Task<List<MovieInfoEntity>> GetComingSoonMoviesPagedAsync(string? searchParam, int skip, int take)
    {
        return await BuildComingSoonMoviesQuery(searchParam)
            .Include(x => x.MovieRequiredAgeEntity)
            .Include(x => x.MovieGenreMovieInfoEntity)
                .ThenInclude(g => g.MovieGenreInfoEntity)
            .Include(x => x.MovieFormatMovieInfoEntity)
                .ThenInclude(f => f.MovieFormatInfoEntity)
            .OrderByDescending(x => x.CreatedAt)
            .Skip(skip)
            .Take(take)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<MovieInfoEntity?> GetMovieDetailAsync(Guid movieId)
    {
        return await _dbContext.Set<MovieInfoEntity>()
            .Include(x => x.MovieRequiredAgeEntity)
            .Include(x => x.MovieGenreMovieInfoEntity)
                .ThenInclude(g => g.MovieGenreInfoEntity)
            .Include(x => x.MovieFormatMovieInfoEntity)
                .ThenInclude(f => f.MovieFormatInfoEntity)
            .Where(x => x.MovieId == movieId && !x.IsDeleted)
            .AsNoTracking()
            .FirstOrDefaultAsync();
    }

    public async Task<List<MovieScheduleInfoEntity>> GetAdvancedSearchSchedulesAsync(
        DateTime startUtc, DateTime endUtc, DateTime nowUtc, Guid? movieId, Guid? cinemaId)
    {
        var query = _dbContext.Set<MovieScheduleInfoEntity>()
            .Where(s => !s.IsDeleted 
                        && s.StartTime >= startUtc 
                        && s.StartTime < endUtc
                        && s.StartTime > nowUtc);

        if (movieId.HasValue)
            query = query.Where(s => s.MovieId == movieId.Value);
        
        if (cinemaId.HasValue)
            query = query.Where(s => s.AuditoriumInfoEntities!.CinemaId == cinemaId.Value);

        return await query
            .Include(s => s.MovieInfoEntity)
                .ThenInclude(m => m.MovieRequiredAgeEntity)
            .Include(s => s.MovieInfoEntity)
                .ThenInclude(m => m.MovieGenreMovieInfoEntity)
                    .ThenInclude(g => g.MovieGenreInfoEntity)
            .Include(s => s.AuditoriumInfoEntities)
                .ThenInclude(a => a.CinemaInfoEntity)
            .Include(s => s.MovieFormatInfoEntity)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<MovieScheduleInfoEntity>> GetCinemaShowtimesAsync(
        Guid movieId, string city, DateTime startUtc, DateTime endUtc, DateTime nowUtc)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .Include(s => s.MovieFormatInfoEntity)
            .Include(s => s.AuditoriumInfoEntities)
                .ThenInclude(a => a.CinemaInfoEntity)
            .Where(s => !s.IsDeleted
                        && s.MovieId == movieId
                        && s.StartTime >= startUtc
                        && s.StartTime < endUtc
                        && s.StartTime > nowUtc
                        && s.AuditoriumInfoEntities!.CinemaInfoEntity.CinemaCity == city)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<MovieScheduleInfoEntity?> GetScheduleForSeatMapAsync(Guid scheduleId)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .Include(s => s.MovieInfoEntity)
            .Include(s => s.MovieFormatInfoEntity)
            .Include(s => s.AuditoriumInfoEntities)
                .ThenInclude(a => a.SeatsInfoEntity)
            .Where(s => s.MovieScheduleInfoId == scheduleId && !s.IsDeleted)
            .AsNoTracking()
            .FirstOrDefaultAsync();
    }

    public async Task<List<Guid>> GetOccupiedSeatIdsAsync(Guid scheduleId)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .Where(od => od.MovieScheduleId == scheduleId
                         && (od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Pending
                             || od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked))
            .Select(od => od.SeatId)
            .Distinct()
            .ToListAsync();
    }

    public async Task<MovieScheduleInfoEntity?> GetScheduleForPricingAsync(Guid scheduleId)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .Include(s => s.MovieFormatInfoEntity)
            .Include(s => s.AuditoriumInfoEntities)
            .FirstOrDefaultAsync(s => s.MovieScheduleInfoId == scheduleId && !s.IsDeleted);
    }

    public async Task<List<UserSegmentsInfoEntity>> GetSegmentsAsync(bool hasHighRole)
    {
        var query = _dbContext.Set<UserSegmentsInfoEntity>().AsQueryable();
        if (!hasHighRole)
        {
            query = query.Where(seg => seg.UserSegmentName == "Adult" || seg.UserSegmentName == "Child");
        }
        return await query.ToListAsync();
    }

    public async Task<List<CinemaSurchargeInfosEntity>> GetCinemaSurchargesAsync(Guid cinemaId, Guid formatId)
    {
        return await _dbContext.Set<CinemaSurchargeInfosEntity>()
            .Where(s => s.CinemaId == cinemaId && s.MovieFormatId == formatId)
            .ToListAsync();
    }

    public async Task<DepartmentEntity?> GetDepartmentBySharedUserIdAsync(Guid userId)
    {
        return await _dbContext.Set<DepartmentEntity>()
            .FirstOrDefaultAsync(d => d.SharedUserId == userId);
    }

    public async Task<StaffWorkingLoggerEntity?> GetActiveStaffLoggerAsync(Guid cinemaId)
    {
        return await _dbContext.Set<StaffWorkingLoggerEntity>()
            .Include(l => l.StaffProfileEntity)
            .FirstOrDefaultAsync(l => l.StaffProfileEntity.CinemaId == cinemaId && l.EndedShiftTime == null);
    }

    public async Task<UserInfoEntity?> FindUserByEmailAsync(string email)
    {
        return await _dbContext.Set<UserInfoEntity>()
            .FirstOrDefaultAsync(u => u.UserEmail == email);
    }

    public async Task<MovieScheduleInfoEntity?> GetScheduleByIdAsync(Guid scheduleId)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .Include(s => s.MovieFormatInfoEntity)
            .Include(s => s.MovieInfoEntity)
            .Include(s => s.AuditoriumInfoEntities)
            .FirstOrDefaultAsync(s => s.MovieScheduleInfoId == scheduleId && !s.IsDeleted);
    }

    public async Task<List<SeatsInfoEntity>> GetValidSeatsAsync(Guid auditoriumId, List<Guid> seatIds)
    {
        return await _dbContext.Set<SeatsInfoEntity>()
            .Where(s => s.AuditoriumId == auditoriumId && seatIds.Contains(s.SeatId))
            .ToListAsync();
    }

    public async Task<List<Guid>> GetAlreadyBookedSeatsAsync(Guid scheduleId, List<Guid> seatIds)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .Where(od => od.MovieScheduleId == scheduleId
                         && seatIds.Contains(od.SeatId)
                         && (od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Pending
                             || od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked))
            .Select(od => od.SeatId)
            .Distinct()
            .ToListAsync();
    }

    public async Task<CustomerProfileEntity?> GetCustomerProfileAsync(Guid userId)
    {
        return await _dbContext.Set<CustomerProfileEntity>()
            .Include(cp => cp.UserSegmentsInfoEntity)
            .FirstOrDefaultAsync(cp => cp.UserId == userId);
    }

    public async Task<UserVoucherEntity?> GetUserVoucherAsync(Guid voucherId, Guid userId)
    {
        return await _dbContext.Set<UserVoucherEntity>()
            .Include(uv => uv.VoucherInfoEntity)
            .FirstOrDefaultAsync(uv => uv.VoucherId == voucherId && uv.UserId == userId && !uv.IsUsed);
    }

    public async Task<UserInfoEntity?> FindUserByIdAsync(Guid userId)
    {
        return await _dbContext.Set<UserInfoEntity>()
            .FirstOrDefaultAsync(u => u.UserId == userId);
    }

    public async Task AddOrderAsync(OrderInfoEntity order)
    {
        await _dbContext.Set<OrderInfoEntity>().AddAsync(order);
    }

    public async Task AddOrderDetailsRangeAsync(List<OrderDetailsInfo> details)
    {
        await _dbContext.Set<OrderDetailsInfo>().AddRangeAsync(details);
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }

    public async Task<IUnitOfWorkTransaction> BeginTransactionAsync()
    {
        var transaction = await _dbContext.Database.BeginTransactionAsync();
        return new EfUnitOfWorkTransaction(transaction);
    }

    public async Task<OrderInfoEntity?> GetOrderWithDetailsAsync(Guid orderId)
    {
        return await _dbContext.Set<OrderInfoEntity>()
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(od => od.MovieScheduleInfoEntity)
                    .ThenInclude(s => s.MovieInfoEntity)
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(od => od.MovieScheduleInfoEntity)
                    .ThenInclude(s => s.MovieFormatInfoEntity)
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(od => od.MovieScheduleInfoEntity)
                    .ThenInclude(s => s.AuditoriumInfoEntities)
                        .ThenInclude(a => a.CinemaInfoEntity)
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(od => od.SeatsInfoEntity)
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(od => od.UserSegmentsInfoEntity)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.OrderId == orderId);
    }

    public async Task<List<OrderInfoEntity>> GetUserBookingHistoryAsync(Guid userId)
    {
        return await _dbContext.Set<OrderInfoEntity>()
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(d => d.MovieScheduleInfoEntity)
                    .ThenInclude(s => s.MovieInfoEntity)
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(d => d.MovieScheduleInfoEntity)
                    .ThenInclude(s => s.AuditoriumInfoEntities)
                        .ThenInclude(a => a.CinemaInfoEntity)
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(d => d.SeatsInfoEntity)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.OrderDate)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<UserInfoEntity?> GetUserAccountInfoAsync(Guid userId)
    {
        return await _dbContext.Set<UserInfoEntity>()
            .Include(u => u.CustomerProfileEntity)
                .ThenInclude(cp => cp.UserSegmentsInfoEntity)
            .FirstOrDefaultAsync(u => u.UserId == userId);
    }

    public async Task<OrderInfoEntity?> GetOrderByIdAsync(Guid orderId)
    {
        return await _dbContext.Set<OrderInfoEntity>()
            .FirstOrDefaultAsync(o => o.OrderId == orderId);
    }

    public async Task<CustomerProfileEntity?> GetCustomerProfileWithSegmentAsync(Guid userId)
    {
        return await _dbContext.Set<CustomerProfileEntity>()
            .Include(cp => cp.UserSegmentsInfoEntity)
            .FirstOrDefaultAsync(cp => cp.UserId == userId);
    }

    public async Task<int> CountOrderDetailsAsync(Guid orderId)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .CountAsync(od => od.OrderId == orderId);
    }

    public async Task<UserVoucherEntity?> GetUserVoucherForUsageAsync(Guid voucherId, Guid userId)
    {
        return await _dbContext.Set<UserVoucherEntity>()
            .FirstOrDefaultAsync(uv => uv.VoucherId == voucherId && uv.UserId == userId && !uv.IsUsed);
    }
}
