using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Constants;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Persistence.Repositories.Booking;

public class BookingPricingRepository : IBookingPricingRepository
{
    private readonly CinemaDbContext _dbContext;

    public BookingPricingRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<MovieScheduleInfoEntity?> GetScheduleForPricingAsync(Guid scheduleId)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .Include(s => s.MovieFormatInfoEntity)
            .Include(s => s.AuditoriumInfoEntities)
            .FirstOrDefaultAsync(s => s.MovieScheduleInfoId == scheduleId && !s.IsDeleted);
    }

    public async Task<List<UserSegmentsInfoEntity>> GetSegmentsAsync()
    {
        return await _dbContext.Set<UserSegmentsInfoEntity>()
            .Where(seg => user_segments_constant.TicketSegmentIds.Contains(seg.UserSegmentId))
            .OrderBy(seg => seg.UserSegmentName == "Adult" ? 0 :
                            seg.UserSegmentName == "Student" ? 1 :
                            seg.UserSegmentName == "Child" ? 2 :
                            seg.UserSegmentName == "Senior" ? 3 : 4)
            .ToListAsync();
    }

    public async Task<List<CinemaSurchargeInfosEntity>> GetCinemaSurchargesAsync(Guid cinemaId, Guid formatId)
    {
        return await _dbContext.Set<CinemaSurchargeInfosEntity>()
            .Where(s => s.CinemaId == cinemaId && s.MovieFormatId == formatId)
            .ToListAsync();
    }
}
