using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Dtos.Booking;
using Cinema.Domain.Entities.GroupBooking;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Persistence.Repositories.Booking;

public class SeatMapRepository : ISeatMapRepository
{
    private readonly CinemaDbContext _dbContext;

    public SeatMapRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<SeatMapScheduleQueryDto?> GetScheduleForSeatMapAsync(Guid scheduleId)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .Where(s => s.MovieScheduleInfoId == scheduleId && !s.IsDeleted)
            .AsNoTracking()
            .Select(s => new SeatMapScheduleQueryDto
            {
                ScheduleId = s.MovieScheduleInfoId,
                AuditoriumNumber = s.AuditoriumInfoEntities != null ? s.AuditoriumInfoEntities.AuditoriumNumber : string.Empty,
                MovieName = s.MovieInfoEntity != null ? s.MovieInfoEntity.MovieName : string.Empty,
                FormatName = s.MovieFormatInfoEntity != null ? s.MovieFormatInfoEntity.MovieFormatName : string.Empty,
                StartTime = s.StartTime,
                CenterRowStart = s.AuditoriumInfoEntities != null ? s.AuditoriumInfoEntities.CenterRowStart : 0,
                CenterRowEnd = s.AuditoriumInfoEntities != null ? s.AuditoriumInfoEntities.CenterRowEnd : 0,
                CenterColStart = s.AuditoriumInfoEntities != null ? s.AuditoriumInfoEntities.CenterColStart : 0,
                CenterColEnd = s.AuditoriumInfoEntities != null ? s.AuditoriumInfoEntities.CenterColEnd : 0,
                Seats = s.AuditoriumInfoEntities != null
                    ? s.AuditoriumInfoEntities.SeatsInfoEntity
                        .Select(seat => new SeatDto
                        {
                            SeatId = seat.SeatId,
                            SeatNumber = seat.SeatNumber,
                            ColIndex = seat.ColIndex,
                            RowIndex = seat.RowIndex,
                            IsOccupied = false
                        })
                        .ToList()
                    : new List<SeatDto>()
            })
            .FirstOrDefaultAsync();
    }

    public async Task<List<Guid>> GetOccupiedSeatIdsAsync(Guid scheduleId)
    {
        var individualBookedSeats = await _dbContext.Set<OrderDetailsInfo>()
            .Where(od => od.MovieScheduleId == scheduleId
                         && od.ReleasedAt == null
                         && od.OrderInfoEntity != null
                         && (od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Pending
                             || od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked))
            .Select(od => od.SeatId)
            .ToListAsync();

        var groupBookedSeats = await _dbContext.Set<GroupBookingSeatEntity>()
            .Where(gs => gs.GroupBookingMember.GroupBookingSession.MovieScheduleId == scheduleId
                         && gs.GroupBookingMember.GroupBookingSession.Status != GroupBookingStatusEnum.Cancelled)
            .Select(gs => gs.SeatId)
            .ToListAsync();

        return individualBookedSeats.Concat(groupBookedSeats).Distinct().ToList();
    }
}
