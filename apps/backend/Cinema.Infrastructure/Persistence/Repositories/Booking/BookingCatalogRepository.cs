using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Repositories;

public class BookingCatalogRepository : IBookingCatalogRepository
{
    private readonly CinemaDbContext _dbContext;

    public BookingCatalogRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<CinemaInfoEntity>> GetActiveCinemasAsync()
    {
        return await _dbContext.Set<CinemaInfoEntity>()
            .Where(c => !c.IsDeleted && c.IsActive)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<CinemaInfoEntity>> GetNearestCinemasAsync()
    {
        return await _dbContext.Set<CinemaInfoEntity>()
            .Where(c => !c.IsDeleted && c.IsActive)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<MovieInfoEntity>> GetActiveMoviesAsync(DateTime nowUtc)
    {
        return await _dbContext.Set<MovieInfoEntity>()
            .Where(m => m.IsActive && !m.IsDeleted && m.EndedDate > nowUtc)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<string>> GetCitiesAsync()
    {
        return await _dbContext.Set<CinemaInfoEntity>()
            .Where(x => !x.IsDeleted)
            .GroupBy(x => x.CinemaCity)
            .Select(g => g.Key)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<MovieGenreInfoEntity>> GetGenresAsync()
    {
        return await _dbContext.Set<MovieGenreInfoEntity>()
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<int> GetNowShowingMoviesCountAsync(string? searchParam)
    {
        return await BuildNowShowingMoviesQuery(searchParam).CountAsync();
    }

    public async Task<List<MovieInfoEntity>> GetNowShowingMoviesPagedAsync(string? searchParam, int skip, int take)
    {
        return await BuildNowShowingMoviesQuery(searchParam)
            .Include(x => x.MovieRequiredAgeEntity)
            .Include(x => x.MovieGenreMovieInfoEntity)
                .ThenInclude(g => g.MovieGenreInfoEntity)
            .Include(x => x.MovieFormatMovieInfoEntity)
                .ThenInclude(f => f.MovieFormatInfoEntity)
            .OrderByDescending(x => x.CreatedAt)
            .Skip(skip)
            .Take(take)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<int> GetComingSoonMoviesCountAsync(string? searchParam)
    {
        return await BuildComingSoonMoviesQuery(searchParam).CountAsync();
    }

    public async Task<List<MovieInfoEntity>> GetComingSoonMoviesPagedAsync(string? searchParam, int skip, int take)
    {
        return await BuildComingSoonMoviesQuery(searchParam)
            .Include(x => x.MovieRequiredAgeEntity)
            .Include(x => x.MovieGenreMovieInfoEntity)
                .ThenInclude(g => g.MovieGenreInfoEntity)
            .Include(x => x.MovieFormatMovieInfoEntity)
                .ThenInclude(f => f.MovieFormatInfoEntity)
            .OrderByDescending(x => x.CreatedAt)
            .Skip(skip)
            .Take(take)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<MovieInfoEntity?> GetMovieDetailAsync(Guid movieId)
    {
        return await _dbContext.Set<MovieInfoEntity>()
            .Include(x => x.MovieRequiredAgeEntity)
            .Include(x => x.MovieGenreMovieInfoEntity)
                .ThenInclude(g => g.MovieGenreInfoEntity)
            .Include(x => x.MovieFormatMovieInfoEntity)
                .ThenInclude(f => f.MovieFormatInfoEntity)
            .Where(x => x.MovieId == movieId && !x.IsDeleted)
            .AsNoTracking()
            .FirstOrDefaultAsync();
    }

    private IQueryable<MovieInfoEntity> BuildNowShowingMoviesQuery(string? searchParam)
    {
        var now = DateTime.UtcNow;
        var query = _dbContext.Set<MovieInfoEntity>()
            .Where(x => !x.IsDeleted && x.IsActive && !x.IsCommingSoon && x.ActiveAt <= now && now <= x.EndedDate);

        if (string.IsNullOrEmpty(searchParam))
        {
            return query;
        }

        var keyword = searchParam.ToLower();
        if (Guid.TryParse(searchParam, out var cinemaId))
        {
            return query.Where(x => x.MovieScheduleInfoEntity.Any(s =>
                !s.IsDeleted && s.AuditoriumInfoEntities!.CinemaId == cinemaId));
        }

        return query.Where(x =>
            x.MovieName.ToLower().Contains(keyword) ||
            x.MovieScheduleInfoEntity.Any(s => !s.IsDeleted &&
                s.AuditoriumInfoEntities!.CinemaInfoEntity.CinemaName.ToLower().Contains(keyword)));
    }

    private IQueryable<MovieInfoEntity> BuildComingSoonMoviesQuery(string? searchParam)
    {
        var query = _dbContext.Set<MovieInfoEntity>()
            .Where(x => !x.IsDeleted && x.IsCommingSoon);

        if (string.IsNullOrEmpty(searchParam))
        {
            return query;
        }

        var keyword = searchParam.ToLower();
        if (Guid.TryParse(searchParam, out var cinemaId))
        {
            return query.Where(x => x.MovieScheduleInfoEntity.Any(s =>
                !s.IsDeleted && s.AuditoriumInfoEntities!.CinemaId == cinemaId));
        }

        return query.Where(x =>
            x.MovieName.ToLower().Contains(keyword) ||
            x.MovieScheduleInfoEntity.Any(s => !s.IsDeleted &&
                s.AuditoriumInfoEntities!.CinemaInfoEntity.CinemaName.ToLower().Contains(keyword)));
    }
}
