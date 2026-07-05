using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.GroupBooking;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Persistence.Repositories.Common;

public class CommonBookingQueries : ICommonBookingQueries
{
    private readonly CinemaDbContext _dbContext;

    public CommonBookingQueries(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Guid>> GetOccupiedSeatIdsAsync(Guid scheduleId, Guid? excludeGroupSessionId = null)
    {
        var individualBookedSeats = await _dbContext.Set<OrderDetailsInfo>()
            .Where(od => od.MovieScheduleId == scheduleId
                         && od.ReleasedAt == null
                         && (od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Pending
                             || od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked))
            .Select(od => od.SeatId)
            .ToListAsync();

        var groupSeatsQuery = _dbContext.Set<GroupBookingSeatEntity>()
            .Where(gs => gs.GroupBookingMember.GroupBookingSession.MovieScheduleId == scheduleId
                         && gs.GroupBookingMember.GroupBookingSession.Status != GroupBookingStatusEnum.Cancelled);

        if (excludeGroupSessionId.HasValue)
        {
            groupSeatsQuery = groupSeatsQuery
                .Where(gs => gs.GroupBookingMember.GroupSessionId != excludeGroupSessionId.Value);
        }

        var groupBookedSeats = await groupSeatsQuery
            .Select(gs => gs.SeatId)
            .ToListAsync();

        return individualBookedSeats.Concat(groupBookedSeats).Distinct().ToList();
    }

    public async Task<MovieScheduleInfoEntity?> GetScheduleByIdAsync(Guid scheduleId)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .Include(s => s.MovieFormatInfoEntity)
            .Include(s => s.MovieInfoEntity)
            .Include(s => s.AuditoriumInfoEntities)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.MovieScheduleInfoId == scheduleId && !s.IsDeleted);
    }

    public async Task<List<SeatsInfoEntity>> GetValidSeatsAsync(Guid auditoriumId, List<Guid> seatIds)
    {
        return await _dbContext.Set<SeatsInfoEntity>()
            .Where(s => s.AuditoriumId == auditoriumId && seatIds.Contains(s.SeatId))
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<UserInfoEntity?> FindUserByIdAsync(Guid userId)
    {
        return await _dbContext.Set<UserInfoEntity>()
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == userId);
    }
}
