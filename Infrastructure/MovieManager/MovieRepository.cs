using Application.Common;
using Application.MovieManager.Ports;
using DataAccess;
using DataAccess.Entities.MovieInfos;
using DataAccess.Entities.UserInfos;
using DataAccess.RelationshipKeys.MovieInfos;
using Microsoft.EntityFrameworkCore;
using Shared.Enums;

namespace Infrastructure.MovieManager;

/// <summary>
/// Repository ghi cho phim, hiện thực bằng EF Core. Xử lý quan hệ N-N (genre/format/cinema)
/// và logic soft/hard delete.
/// </summary>
public class MovieRepository : IMovieRepository
{
    private readonly CinemaDbContext _dbContext;
    private readonly IClock _clock;

    public MovieRepository(CinemaDbContext dbContext, IClock clock)
    {
        _dbContext = dbContext;
        _clock = clock;
    }

    public Task<bool> NameExistsAsync(string name, Guid? excludeMovieId, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.MovieInfoEntity.Where(x => x.MovieName == name && !x.IsDeleted);
        if (excludeMovieId != null)
        {
            query = query.Where(x => x.MovieId != excludeMovieId);
        }
        return query.AnyAsync(cancellationToken);
    }

    public Task<bool> DescriptionExistsAsync(
        string description, Guid? excludeMovieId, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.MovieInfoEntity.Where(x => x.MovieDescription == description && !x.IsDeleted);
        if (excludeMovieId != null)
        {
            query = query.Where(x => x.MovieId != excludeMovieId);
        }
        return query.AnyAsync(cancellationToken);
    }

    public async Task<MovieStateInfo?> GetStateAsync(Guid movieId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.MovieInfoEntity
            .Where(x => x.MovieId == movieId)
            .Select(x => new MovieStateInfo(x.MovieId, x.IsDeleted, x.MovieImageUrl, x.ActiveAt, x.EndedDate))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<bool> HasSuccessfulBookingAsync(Guid movieId, CancellationToken cancellationToken = default)
    {
        return _dbContext.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleInfoEntity.MovieId == movieId
                            && od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked, cancellationToken);
    }

    public Task<bool> HasAnyBookingAsync(Guid movieId, CancellationToken cancellationToken = default)
    {
        return _dbContext.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleInfoEntity.MovieId == movieId, cancellationToken);
    }

    public async Task AddAsync(NewMovieData movie, CancellationToken cancellationToken = default)
    {
        var now = _clock.VietnamNow;
        var entity = new MovieInfoEntity
        {
            MovieId = movie.MovieId,
            MovieRequiredAgeId = movie.MovieRequiredAgeId,
            MovieName = movie.MovieName,
            MovieDescription = movie.MovieDescription,
            MovieImageUrl = movie.MovieImageUrl,
            ActiveAt = movie.StartedDate,
            EndedDate = movie.EndedDate,
            IsActive = now >= movie.StartedDate && movie.EndedDate > now,
            IsCommingSoon = now < movie.StartedDate,
            CreatedByUserId = movie.CreatedByUserId,
            MovieManagerId = movie.CreatedByUserId,
            MovieDuration = movie.Duration,
            TrailerUrl = movie.TrailerUrl,
            Director = movie.Director,
            Actors = movie.Actors,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _dbContext.MovieInfoEntity.AddAsync(entity, cancellationToken);
        await _dbContext.MovieFormatMovieInfoEntity.AddRangeAsync(
            movie.MovieFormatIds.Select(id => new movieFormatMovieInfoEntity { MovieId = movie.MovieId, FormatId = id }),
            cancellationToken);
        await _dbContext.MovieGenreMovieInfoEntity.AddRangeAsync(
            movie.MovieGenreIds.Select(id => new MovieGenreMovieInfoEntity { MovieId = movie.MovieId, MovieGenreId = id }),
            cancellationToken);
        await _dbContext.MovieCinemaEntities.AddRangeAsync(
            movie.CinemaIds.Select(id => new MovieCinemaEntity { MovieId = movie.MovieId, CinemaId = id }),
            cancellationToken);
    }

    public async Task<bool> UpdateAsync(
        Guid movieId, MovieUpdateData update, CancellationToken cancellationToken = default)
    {
        var movie = await _dbContext.MovieInfoEntity.FirstOrDefaultAsync(x => x.MovieId == movieId, cancellationToken);
        if (movie == null)
        {
            return false;
        }

        var now = _clock.VietnamNow;
        movie.MovieRequiredAgeId = update.MovieRequiredAgeId ?? movie.MovieRequiredAgeId;
        movie.MovieDescription = update.MovieDescription ?? movie.MovieDescription;
        movie.MovieName = update.MovieName ?? movie.MovieName;
        movie.ActiveAt = update.StartedDate ?? movie.ActiveAt;
        movie.EndedDate = update.EndedDate ?? movie.EndedDate;
        movie.UpdatedAt = now;
        movie.UpdatedByUserId = update.UpdatedByUserId;
        movie.IsActive = (update.EndedDate ?? movie.EndedDate) > now && (update.StartedDate ?? movie.ActiveAt) <= now;
        movie.IsCommingSoon = (update.StartedDate ?? movie.ActiveAt) > now;
        movie.MovieDuration = update.Duration ?? movie.MovieDuration;
        movie.TrailerUrl = update.TrailerUrl ?? movie.TrailerUrl;
        movie.Director = update.Director ?? movie.Director;
        movie.Actors = update.Actors ?? movie.Actors;
        if (update.MovieImageUrl != null)
        {
            movie.MovieImageUrl = update.MovieImageUrl;
        }

        if (update.MovieFormatIds is { Count: > 0 })
        {
            _dbContext.MovieFormatMovieInfoEntity.RemoveRange(
                _dbContext.MovieFormatMovieInfoEntity.Where(x => x.MovieId == movieId));
            _dbContext.MovieFormatMovieInfoEntity.AddRange(
                update.MovieFormatIds.Distinct().Select(id => new movieFormatMovieInfoEntity { MovieId = movieId, FormatId = id }));
        }
        if (update.MovieGenreIds is { Count: > 0 })
        {
            _dbContext.MovieGenreMovieInfoEntity.RemoveRange(
                _dbContext.MovieGenreMovieInfoEntity.Where(x => x.MovieId == movieId));
            _dbContext.MovieGenreMovieInfoEntity.AddRange(
                update.MovieGenreIds.Distinct().Select(id => new MovieGenreMovieInfoEntity { MovieId = movieId, MovieGenreId = id }));
        }
        if (update.CinemaIds is { Count: > 0 })
        {
            _dbContext.MovieCinemaEntities.RemoveRange(
                _dbContext.MovieCinemaEntities.Where(x => x.MovieId == movieId));
            _dbContext.MovieCinemaEntities.AddRange(
                update.CinemaIds.Distinct().Select(id => new MovieCinemaEntity { MovieId = movieId, CinemaId = id }));
        }

        return true;
    }

    public async Task SoftDeleteAsync(Guid movieId, Guid deletedByUserId, CancellationToken cancellationToken = default)
    {
        var movie = await _dbContext.MovieInfoEntity.FirstOrDefaultAsync(x => x.MovieId == movieId, cancellationToken);
        if (movie == null)
        {
            return;
        }
        movie.IsDeleted = true;
        movie.DeletedByUserId = deletedByUserId;
        movie.DeletedAt = _clock.VietnamNow;
    }

    public async Task HardDeleteAsync(Guid movieId, CancellationToken cancellationToken = default)
    {
        var schedules = await _dbContext.MovieScheduleInfoEntity.Where(x => x.MovieId == movieId).ToListAsync(cancellationToken);
        _dbContext.MovieScheduleInfoEntity.RemoveRange(schedules);

        _dbContext.MovieFormatMovieInfoEntity.RemoveRange(
            await _dbContext.MovieFormatMovieInfoEntity.Where(x => x.MovieId == movieId).ToListAsync(cancellationToken));
        _dbContext.MovieGenreMovieInfoEntity.RemoveRange(
            await _dbContext.MovieGenreMovieInfoEntity.Where(x => x.MovieId == movieId).ToListAsync(cancellationToken));
        _dbContext.MovieCinemaEntities.RemoveRange(
            await _dbContext.MovieCinemaEntities.Where(x => x.MovieId == movieId).ToListAsync(cancellationToken));

        var movie = await _dbContext.MovieInfoEntity.FirstOrDefaultAsync(x => x.MovieId == movieId, cancellationToken);
        if (movie != null)
        {
            _dbContext.MovieInfoEntity.Remove(movie);
        }
    }
}
