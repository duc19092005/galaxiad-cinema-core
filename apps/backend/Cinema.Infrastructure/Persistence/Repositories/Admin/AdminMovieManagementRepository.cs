using Cinema.Application.Dtos.MovieManager.Responses;
using Cinema.Application.Interfaces.Admin;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Repositories;

public class AdminMovieManagementRepository : IAdminMovieManagementRepository
{
    private readonly CinemaDbContext _dbContext;

    public AdminMovieManagementRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<ResGetMovieInfosMovieManagerDto>> GetMovieInfosAsync(Guid? currentUserId, bool isAdmin, Guid? cinemaId)
    {
        return await _dbContext.Set<MovieInfoEntity>()
            .Select(x => new ResGetMovieInfosMovieManagerDto
            {
                MovieId = x.MovieId,
                MovieDescriptions = x.MovieDescription,
                MovieGenresInfos = x.MovieGenreMovieInfoEntity.Select(y => y.MovieGenreInfoEntity.MovieGenreName).ToList(),
                MovieImageUrl = x.MovieImageUrl,
                MovieBannerUrl = x.MovieBannerUrl,
                MovieName = x.MovieName,
                MovieVisualFormatInfos = x.MovieFormatMovieInfoEntity.Select(y => y.MovieFormatInfoEntity.MovieFormatName).ToList(),
                MovieCinemas = _dbContext.Set<MovieCinemaEntity>()
                    .Where(mc => mc.MovieId == x.MovieId)
                    .Select(mc => new ResMovieCinemaDto { CinemaId = mc.CinemaId, CinemaName = mc.CinemaInfoEntity.CinemaName })
                    .ToList(),
                Duration = x.MovieDuration,
                EndedDate = DateTime.SpecifyKind(x.EndedDate, DateTimeKind.Utc),
                StartedDate = DateTime.SpecifyKind(x.ActiveAt, DateTimeKind.Utc),
                CreatedAt = DateTime.SpecifyKind(x.CreatedAt, DateTimeKind.Utc),
                UpdatedAt = DateTime.SpecifyKind(x.UpdatedAt, DateTimeKind.Utc),
                CreatedBy = _dbContext.Set<UserInfoEntity>()
                    .Where(u => u.UserId == x.CreatedByUserId)
                    .Select(u => u.UserName)
                    .FirstOrDefault() ?? "System Administrator",
                UpdatedBy = x.UpdatedByUserId != null
                    ? _dbContext.Set<UserInfoEntity>()
                        .Where(u => u.UserId == x.UpdatedByUserId)
                        .Select(u => u.UserName)
                        .FirstOrDefault() ?? ""
                    : "",
                TrailerUrl = x.TrailerUrl,
                Director = x.Director,
                Actors = x.Actors,
                MovieRequiredAgeSymbol = x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.Trim(),
                MovieManagerName = x.MovieManager != null ? x.MovieManager.UserName : "ChÆ°a cÃ³"
            })
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<ResGetMovieInfosMovieManagerDto?> GetMovieInfoByIdAsync(Guid movieId, Guid? currentUserId, bool isAdmin)
    {
        return await _dbContext.Set<MovieInfoEntity>()
            .Where(x => x.MovieId == movieId)
            .Select(m => new ResGetMovieInfosMovieManagerDto
            {
                MovieId = m.MovieId,
                MovieDescriptions = m.MovieDescription,
                MovieGenresInfos = m.MovieGenreMovieInfoEntity.Select(y => y.MovieGenreInfoEntity.MovieGenreName).ToList(),
                MovieImageUrl = m.MovieImageUrl,
                MovieName = m.MovieName,
                MovieVisualFormatInfos = m.MovieFormatMovieInfoEntity.Select(y => y.MovieFormatInfoEntity.MovieFormatName).ToList(),
                MovieCinemas = _dbContext.Set<MovieCinemaEntity>()
                    .Where(mc => mc.MovieId == m.MovieId)
                    .Select(mc => new ResMovieCinemaDto { CinemaId = mc.CinemaId, CinemaName = mc.CinemaInfoEntity.CinemaName })
                    .ToList(),
                Duration = m.MovieDuration,
                EndedDate = DateTime.SpecifyKind(m.EndedDate, DateTimeKind.Utc),
                StartedDate = DateTime.SpecifyKind(m.ActiveAt, DateTimeKind.Utc),
                CreatedAt = DateTime.SpecifyKind(m.CreatedAt, DateTimeKind.Utc),
                UpdatedAt = DateTime.SpecifyKind(m.UpdatedAt, DateTimeKind.Utc),
                CreatedBy = _dbContext.Set<UserInfoEntity>()
                    .Where(u => u.UserId == m.CreatedByUserId)
                    .Select(u => u.UserName)
                    .FirstOrDefault() ?? "System Administrator",
                UpdatedBy = m.UpdatedByUserId != null
                    ? _dbContext.Set<UserInfoEntity>()
                        .Where(u => u.UserId == m.UpdatedByUserId)
                        .Select(u => u.UserName)
                        .FirstOrDefault() ?? ""
                    : "",
                TrailerUrl = m.TrailerUrl,
                Director = m.Director,
                Actors = m.Actors,
                MovieRequiredAgeSymbol = m.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.Trim(),
                MovieManagerName = m.MovieManager != null ? m.MovieManager.UserName : "ChÆ°a cÃ³"
            })
            .FirstOrDefaultAsync();
    }

    public async Task<MovieInfoEntity?> GetMovieInfoEntityAsync(Guid movieId)
    {
        return await _dbContext.Set<MovieInfoEntity>().FirstOrDefaultAsync(x => x.MovieId == movieId);
    }

    public async Task<bool> HasSuccessfulBookingAsync(Guid movieId)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleInfoEntity.MovieId == movieId &&
                            od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked);
    }

    public async Task<bool> HasAnyBookingAsync(Guid movieId)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleInfoEntity.MovieId == movieId);
    }

    public async Task<List<movieFormatMovieInfoEntity>> GetMovieFormatsByMovieIdAsync(Guid movieId)
    {
        return await _dbContext.Set<movieFormatMovieInfoEntity>().Where(x => x.MovieId == movieId).ToListAsync();
    }

    public async Task<List<MovieGenreMovieInfoEntity>> GetMovieGenresByMovieIdAsync(Guid movieId)
    {
        return await _dbContext.Set<MovieGenreMovieInfoEntity>().Where(x => x.MovieId == movieId).ToListAsync();
    }

    public async Task<List<MovieCinemaEntity>> GetMovieCinemasByMovieIdAsync(Guid movieId)
    {
        return await _dbContext.Set<MovieCinemaEntity>().Where(x => x.MovieId == movieId).ToListAsync();
    }

    public async Task AddMovieAsync(MovieInfoEntity movie)
    {
        await _dbContext.Set<MovieInfoEntity>().AddAsync(movie);
    }

    public async Task AddMovieFormatsAsync(IEnumerable<movieFormatMovieInfoEntity> formats)
    {
        await _dbContext.Set<movieFormatMovieInfoEntity>().AddRangeAsync(formats);
    }

    public async Task AddMovieGenresAsync(IEnumerable<MovieGenreMovieInfoEntity> genres)
    {
        await _dbContext.Set<MovieGenreMovieInfoEntity>().AddRangeAsync(genres);
    }

    public async Task AddMovieCinemasAsync(IEnumerable<MovieCinemaEntity> cinemas)
    {
        await _dbContext.Set<MovieCinemaEntity>().AddRangeAsync(cinemas);
    }

    public void RemoveMovieFormats(IEnumerable<movieFormatMovieInfoEntity> formats)
    {
        _dbContext.Set<movieFormatMovieInfoEntity>().RemoveRange(formats);
    }

    public void RemoveMovieGenres(IEnumerable<MovieGenreMovieInfoEntity> genres)
    {
        _dbContext.Set<MovieGenreMovieInfoEntity>().RemoveRange(genres);
    }

    public void RemoveMovieCinemas(IEnumerable<MovieCinemaEntity> cinemas)
    {
        _dbContext.Set<MovieCinemaEntity>().RemoveRange(cinemas);
    }

    public void RemoveMovie(MovieInfoEntity movie)
    {
        _dbContext.Set<MovieInfoEntity>().Remove(movie);
    }

    public void UpdateMovie(MovieInfoEntity movie)
    {
        _dbContext.Set<MovieInfoEntity>().Update(movie);
    }

    public async Task HardDeleteMovieAsync(Guid movieId)
    {
        var schedules = await _dbContext.Set<MovieScheduleInfoEntity>().Where(x => x.MovieId == movieId).ToListAsync();
        _dbContext.Set<MovieScheduleInfoEntity>().RemoveRange(schedules);

        var movieFormats = await _dbContext.Set<movieFormatMovieInfoEntity>().Where(x => x.MovieId == movieId).ToListAsync();
        _dbContext.Set<movieFormatMovieInfoEntity>().RemoveRange(movieFormats);

        var movieGenres = await _dbContext.Set<MovieGenreMovieInfoEntity>().Where(x => x.MovieId == movieId).ToListAsync();
        _dbContext.Set<MovieGenreMovieInfoEntity>().RemoveRange(movieGenres);

        var movieCinemas = await _dbContext.Set<MovieCinemaEntity>().Where(x => x.MovieId == movieId).ToListAsync();
        _dbContext.Set<MovieCinemaEntity>().RemoveRange(movieCinemas);

        var movie = await _dbContext.Set<MovieInfoEntity>().FindAsync(movieId);
        if (movie != null)
        {
            _dbContext.Set<MovieInfoEntity>().Remove(movie);
        }
    }

    public async Task<bool> IsMovieNameExistsAsync(string name, Guid? excludeMovieId)
    {
        if (excludeMovieId != null)
        {
            return await _dbContext.Set<MovieInfoEntity>().AnyAsync(x =>
                x.MovieName == name && x.MovieId != excludeMovieId && !x.IsDeleted);
        }

        return await _dbContext.Set<MovieInfoEntity>().AnyAsync(x =>
            x.MovieName == name && !x.IsDeleted);
    }

    public async Task<bool> IsMovieDescriptionExistsAsync(string description, Guid? excludeMovieId)
    {
        if (excludeMovieId != null)
        {
            return await _dbContext.Set<MovieInfoEntity>().AnyAsync(x =>
                x.MovieDescription == description && x.MovieId != excludeMovieId && !x.IsDeleted);
        }

        return await _dbContext.Set<MovieInfoEntity>().AnyAsync(x =>
            x.MovieDescription == description && !x.IsDeleted);
    }
}
