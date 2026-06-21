using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Repositories;

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
}
