using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Dtos.TheaterManager;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Repositories;

public class TheaterManagerDataRepository : ITheaterManagerDataRepository
{
    private readonly CinemaDbContext _dbContext;

    public TheaterManagerDataRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> IsManagerOfCinemaAsync(Guid cinemaId, Guid userId)
    {
        return await _dbContext.Set<CinemaInfoEntity>()
            .AnyAsync(c => c.CinemaId == cinemaId &&
                           (c.TheaterManagerId == userId || c.FacilitiesManagerId == userId));
    }

    public async Task<List<TheaterManagerMovieOptionDto>> GetMoviesWithFormatsAsync(Guid cinemaId)
    {
        var authorizedMovieIds = await _dbContext.Set<MovieCinemaEntity>()
            .Where(mc => mc.CinemaId == cinemaId)
            .Select(mc => mc.MovieId)
            .ToListAsync();

        return await _dbContext.Set<movieFormatMovieInfoEntity>()
            .Include(mf => mf.MovieInfoEntity)
            .Include(mf => mf.MovieFormatInfoEntity)
            .Where(mf => authorizedMovieIds.Contains(mf.MovieId) &&
                         !mf.MovieInfoEntity.IsDeleted &&
                         mf.MovieFormatInfoEntity.IsActive &&
                         !mf.MovieFormatInfoEntity.IsDeleted)
            .Select(mf => new TheaterManagerMovieOptionDto
            {
                MovieId = mf.MovieId,
                MovieName = mf.MovieInfoEntity.MovieName,
                FormatId = mf.FormatId,
                FormatName = mf.MovieFormatInfoEntity.MovieFormatName
            })
            .ToListAsync();
    }

    public async Task<TheaterManagerAuditoriumSelectionDto?> GetMyAuditoriumsAsync(Guid? cinemaId, Guid userId, bool isAdmin)
    {
        var query = _dbContext.Set<CinemaInfoEntity>().AsNoTracking();

        if (!isAdmin)
        {
            query = query.Where(c => c.TheaterManagerId == userId);
        }

        if (cinemaId.HasValue)
        {
            query = query.Where(c => c.CinemaId == cinemaId.Value);
        }

        var cinema = await query.FirstOrDefaultAsync();

        if (cinema == null) return null;

        var auditoriums = await _dbContext.Set<AuditoriumInfoEntities>()
            .AsNoTracking()
            .Where(a => a.CinemaId == cinema.CinemaId && a.IsActive && !a.IsDeleted)
            .Select(a => new TheaterManagerAuditoriumOptionDto
            {
                AuditoriumId = a.AuditoriumId,
                AuditoriumNumber = a.AuditoriumNumber,
                TotalSeats = a.SeatsInfoEntity.Count,
                Formats = a.AuditoriumFormatInfosList.Select(af => new TheaterManagerAuditoriumFormatOptionDto
                {
                    FormatId = af.FormatId,
                    FormatName = af.MovieFormatInfoEntity.MovieFormatName
                }).ToList()
            })
            .ToListAsync();

        return new TheaterManagerAuditoriumSelectionDto
        {
            CinemaName = cinema.CinemaName,
            Auditoriums = auditoriums
        };
    }
}
