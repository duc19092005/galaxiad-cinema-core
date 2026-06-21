using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Repositories;

public class BookingShowtimeRepository : IBookingShowtimeRepository
{
    private readonly CinemaDbContext _dbContext;

    public BookingShowtimeRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
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
}
