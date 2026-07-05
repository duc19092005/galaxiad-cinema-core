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
    private readonly ICommonBookingQueries _common;

    public SeatMapRepository(CinemaDbContext dbContext, ICommonBookingQueries common)
    {
        _dbContext = dbContext;
        _common = common;
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

    public Task<List<Guid>> GetOccupiedSeatIdsAsync(Guid scheduleId)
        => _common.GetOccupiedSeatIdsAsync(scheduleId);
}
