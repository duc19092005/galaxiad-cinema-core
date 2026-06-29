using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Repositories;

public class UserBookingRepository : IUserBookingRepository
{
    private readonly CinemaDbContext _dbContext;

    public UserBookingRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<OrderInfoEntity>> GetUserBookingHistoryAsync(Guid userId)
    {
        return await _dbContext.Set<OrderInfoEntity>()
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(d => d.MovieScheduleInfoEntity!)
                    .ThenInclude(s => s.MovieInfoEntity!)
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(d => d.MovieScheduleInfoEntity!)
                    .ThenInclude(s => s.AuditoriumInfoEntities!)
                        .ThenInclude(a => a.CinemaInfoEntity!)
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(d => d.SeatsInfoEntity!)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.OrderDate)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<UserInfoEntity?> GetUserAccountInfoAsync(Guid userId)
    {
        return await _dbContext.Set<UserInfoEntity>()
            .Include(u => u.CustomerProfileEntity!)
                .ThenInclude(cp => cp.UserSegmentsInfoEntity!)
            .FirstOrDefaultAsync(u => u.UserId == userId);
    }

    public async Task<OrderInfoEntity?> GetOrderByBookingCodeAsync(string bookingCode)
    {
        return await _dbContext.Set<OrderInfoEntity>()
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(d => d.MovieScheduleInfoEntity!)
                    .ThenInclude(s => s.MovieInfoEntity!)
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(d => d.MovieScheduleInfoEntity!)
                    .ThenInclude(s => s.AuditoriumInfoEntities!)
                        .ThenInclude(a => a.CinemaInfoEntity!)
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(d => d.SeatsInfoEntity!)
            .Where(o => o.BookingCode == bookingCode)
            .AsNoTracking()
            .FirstOrDefaultAsync();
    }
}
