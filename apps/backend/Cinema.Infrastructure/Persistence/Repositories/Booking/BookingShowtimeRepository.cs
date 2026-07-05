using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Dtos.Booking;
using Cinema.Domain.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Persistence.Repositories.Booking;

public class BookingShowtimeRepository : IBookingShowtimeRepository
{
    private readonly CinemaDbContext _dbContext;

    public BookingShowtimeRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<ScheduleSearchRowDto>> GetAdvancedSearchSchedulesAsync(
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
            query = query.Where(s => s.AuditoriumInfoEntities != null && s.AuditoriumInfoEntities.CinemaId == cinemaId.Value);

        return await query
            .AsNoTracking()
            .Select(s => new ScheduleSearchRowDto
            {
                ScheduleId = s.MovieScheduleInfoId,
                StartTime = s.StartTime,
                EndedTime = s.EndedTime,
                MovieId = s.MovieId,
                MovieName = s.MovieInfoEntity != null ? s.MovieInfoEntity.MovieName : string.Empty,
                MovieImageUrl = s.MovieInfoEntity != null ? s.MovieInfoEntity.MovieImageUrl : string.Empty,
                MovieDuration = s.MovieInfoEntity != null ? s.MovieInfoEntity.MovieDuration : 0,
                MovieDescription = s.MovieInfoEntity != null ? s.MovieInfoEntity.MovieDescription : string.Empty,
                MovieRequiredAgeSymbol = s.MovieInfoEntity != null && s.MovieInfoEntity.MovieRequiredAgeEntity != null
                    ? (s.MovieInfoEntity.MovieRequiredAgeEntity.MovieRequiredAgeSymbol ?? string.Empty).Trim()
                    : string.Empty,
                MovieGenres = s.MovieInfoEntity != null
                    ? s.MovieInfoEntity.MovieGenreMovieInfoEntity.Select(g => g.MovieGenreInfoEntity.MovieGenreName).ToList()
                    : new List<string>(),
                CinemaId = s.AuditoriumInfoEntities != null ? s.AuditoriumInfoEntities.CinemaId : Guid.Empty,
                CinemaName = s.AuditoriumInfoEntities != null && s.AuditoriumInfoEntities.CinemaInfoEntity != null
                    ? s.AuditoriumInfoEntities.CinemaInfoEntity.CinemaName
                    : string.Empty,
                CinemaLocation = s.AuditoriumInfoEntities != null && s.AuditoriumInfoEntities.CinemaInfoEntity != null
                    ? s.AuditoriumInfoEntities.CinemaInfoEntity.CinemaLocation
                    : string.Empty,
                CinemaCity = s.AuditoriumInfoEntities != null && s.AuditoriumInfoEntities.CinemaInfoEntity != null
                    ? s.AuditoriumInfoEntities.CinemaInfoEntity.CinemaCity
                    : string.Empty,
                FormatId = s.MovieFormatId,
                FormatName = s.MovieFormatInfoEntity != null ? s.MovieFormatInfoEntity.MovieFormatName : string.Empty,
                AuditoriumId = s.AuditoriumId,
                AuditoriumNumber = s.AuditoriumInfoEntities != null ? s.AuditoriumInfoEntities.AuditoriumNumber : string.Empty
            })
            .ToListAsync();
    }

    public async Task<List<ScheduleSearchRowDto>> GetCinemaShowtimesAsync(
        Guid movieId, string city, DateTime startUtc, DateTime endUtc, DateTime nowUtc)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .Where(s => !s.IsDeleted
                        && s.MovieId == movieId
                        && s.StartTime >= startUtc
                        && s.StartTime < endUtc
                        && s.StartTime > nowUtc
                        && s.AuditoriumInfoEntities != null
                        && s.AuditoriumInfoEntities.CinemaInfoEntity != null
                        && s.AuditoriumInfoEntities.CinemaInfoEntity.CinemaCity == city)
            .AsNoTracking()
            .Select(s => new ScheduleSearchRowDto
            {
                ScheduleId = s.MovieScheduleInfoId,
                StartTime = s.StartTime,
                EndedTime = s.EndedTime,
                MovieId = s.MovieId,
                CinemaId = s.AuditoriumInfoEntities != null ? s.AuditoriumInfoEntities.CinemaId : Guid.Empty,
                CinemaName = s.AuditoriumInfoEntities != null && s.AuditoriumInfoEntities.CinemaInfoEntity != null
                    ? s.AuditoriumInfoEntities.CinemaInfoEntity.CinemaName
                    : string.Empty,
                CinemaLocation = s.AuditoriumInfoEntities != null && s.AuditoriumInfoEntities.CinemaInfoEntity != null
                    ? s.AuditoriumInfoEntities.CinemaInfoEntity.CinemaLocation
                    : string.Empty,
                CinemaCity = s.AuditoriumInfoEntities != null && s.AuditoriumInfoEntities.CinemaInfoEntity != null
                    ? s.AuditoriumInfoEntities.CinemaInfoEntity.CinemaCity
                    : string.Empty,
                FormatId = s.MovieFormatId,
                FormatName = s.MovieFormatInfoEntity != null ? s.MovieFormatInfoEntity.MovieFormatName : string.Empty,
                AuditoriumId = s.AuditoriumId,
                AuditoriumNumber = s.AuditoriumInfoEntities != null ? s.AuditoriumInfoEntities.AuditoriumNumber : string.Empty
            })
            .ToListAsync();
    }
}
