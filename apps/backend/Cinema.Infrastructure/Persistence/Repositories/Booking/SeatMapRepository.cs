using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Repositories;

public class SeatMapRepository : ISeatMapRepository
{
    private readonly CinemaDbContext _dbContext;

    public SeatMapRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<MovieScheduleInfoEntity?> GetScheduleForSeatMapAsync(Guid scheduleId)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .Include(s => s.MovieInfoEntity!)
            .Include(s => s.MovieFormatInfoEntity!)
            .Include(s => s.AuditoriumInfoEntities!)
                .ThenInclude(a => a.SeatsInfoEntity!)
            .Where(s => s.MovieScheduleInfoId == scheduleId && !s.IsDeleted)
            .AsNoTracking()
            .FirstOrDefaultAsync();
    }

    public async Task<List<Guid>> GetOccupiedSeatIdsAsync(Guid scheduleId)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .Where(od => od.MovieScheduleId == scheduleId
                         && od.OrderInfoEntity != null
                         && (od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Pending
                             || od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked))
            .Select(od => od.SeatId)
            .Distinct()
            .ToListAsync();
    }
}
