using Application.Common;
using Application.TheaterManager.Ports;
using DataAccess;
using DataAccess.Entities.MovieInfos;
using DataAccess.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;
using Shared.Enums;

namespace Infrastructure.TheaterManager;

/// <summary>
/// Repository cho luồng xếp lịch chiếu, hiện thực bằng EF Core.
/// </summary>
public class SchedulingRepository : ISchedulingRepository
{
    private readonly CinemaDbContext _dbContext;
    private readonly IClock _clock;

    public SchedulingRepository(CinemaDbContext dbContext, IClock clock)
    {
        _dbContext = dbContext;
        _clock = clock;
    }

    public async Task<Guid?> GetOwnedAuditoriumCinemaIdAsync(
        Guid auditoriumId, Guid userId, bool isAdmin, bool includeFacilitiesManager,
        CancellationToken cancellationToken = default)
    {
        var auditorium = await _dbContext.AuditoriumInfoEntities
            .AsNoTracking()
            .Where(x => x.AuditoriumId == auditoriumId)
            .Select(x => new
            {
                x.CinemaId,
                x.CinemaInfoEntity.TheaterManagerId,
                x.CinemaInfoEntity.FacilitiesManagerId
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (auditorium == null)
        {
            return null;
        }

        var owns = isAdmin
            || auditorium.TheaterManagerId == userId
            || (includeFacilitiesManager && auditorium.FacilitiesManagerId == userId);

        return owns ? auditorium.CinemaId : null;
    }

    public async Task<Dictionary<Guid, SchedulingMovieInfo>> GetActiveMoviesAsync(
        IReadOnlyCollection<Guid> movieIds, CancellationToken cancellationToken = default)
    {
        return await _dbContext.MovieInfoEntity
            .AsNoTracking()
            .Where(m => movieIds.Contains(m.MovieId) && m.IsActive && !m.IsDeleted)
            .Select(m => new SchedulingMovieInfo(m.MovieId, m.MovieName, m.MovieDuration, m.ActiveAt, m.EndedDate))
            .ToDictionaryAsync(m => m.MovieId, cancellationToken);
    }

    public async Task<Dictionary<Guid, List<Guid>>> GetMovieSupportedFormatsAsync(
        IReadOnlyCollection<Guid> movieIds, CancellationToken cancellationToken = default)
    {
        var rows = await _dbContext.MovieFormatMovieInfoEntity
            .AsNoTracking()
            .Where(x => movieIds.Contains(x.MovieId))
            .Select(x => new { x.MovieId, x.FormatId })
            .ToListAsync(cancellationToken);

        return rows.GroupBy(x => x.MovieId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.FormatId).ToList());
    }

    public async Task<Dictionary<Guid, string>> GetAllFormatNamesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Set<MovieFormatInfoEntity>()
            .AsNoTracking()
            .ToDictionaryAsync(x => x.MovieFormatId, x => x.MovieFormatName, cancellationToken);
    }

    public async Task<List<Guid>> GetAuthorizedMovieIdsAsync(
        Guid cinemaId, IReadOnlyCollection<Guid> movieIds, CancellationToken cancellationToken = default)
    {
        return await _dbContext.MovieCinemaEntities
            .AsNoTracking()
            .Where(x => x.CinemaId == cinemaId && movieIds.Contains(x.MovieId))
            .Select(x => x.MovieId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ExistingSchedule>> GetAuditoriumSchedulesAsync(
        Guid auditoriumId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.MovieScheduleInfoEntity
            .AsNoTracking()
            .Where(x => x.AuditoriumId == auditoriumId && !x.IsDeleted)
            .Select(x => new ExistingSchedule(
                x.MovieScheduleInfoId, x.MovieId, x.MovieFormatId, x.StartTime, x.EndedTime))
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ExistingSchedule>> GetSchedulesByIdsAsync(
        Guid auditoriumId, IReadOnlyCollection<Guid> scheduleIds, CancellationToken cancellationToken = default)
    {
        return await _dbContext.MovieScheduleInfoEntity
            .AsNoTracking()
            .Where(x => x.AuditoriumId == auditoriumId && scheduleIds.Contains(x.MovieScheduleInfoId) && !x.IsDeleted)
            .Select(x => new ExistingSchedule(
                x.MovieScheduleInfoId, x.MovieId, x.MovieFormatId, x.StartTime, x.EndedTime))
            .ToListAsync(cancellationToken);
    }

    public Task<bool> HasSuccessfulBookingAsync(
        IReadOnlyCollection<Guid> scheduleIds, CancellationToken cancellationToken = default)
    {
        return _dbContext.Set<OrderDetailsInfo>()
            .AnyAsync(od => scheduleIds.Contains(od.MovieScheduleId)
                            && od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked, cancellationToken);
    }

    public Task<bool> HasCompletedOrderAsync(Guid scheduleId, CancellationToken cancellationToken = default)
    {
        return _dbContext.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleId == scheduleId
                            && od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Completed, cancellationToken);
    }

    public async Task<ScheduleState?> GetScheduleStateAsync(Guid scheduleId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.MovieScheduleInfoEntity
            .Where(x => x.MovieScheduleInfoId == scheduleId)
            .Select(x => new ScheduleState(x.MovieScheduleInfoId, x.IsDeleted))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task AddSchedulesAsync(IEnumerable<NewSchedule> schedules, CancellationToken cancellationToken = default)
    {
        var entities = schedules.Select(s => new MovieScheduleInfoEntity
        {
            MovieScheduleInfoId = s.ScheduleId,
            MovieId = s.MovieId,
            AuditoriumId = s.AuditoriumId,
            MovieFormatId = s.FormatId,
            ActiveAt = s.StartTime,
            StartTime = s.StartTime,
            EndedTime = s.EndedTime,
            CreatedByUserId = s.CreatedByUserId,
            IsActive = s.IsActive
        });

        await _dbContext.MovieScheduleInfoEntity.AddRangeAsync(entities, cancellationToken);
    }

    public async Task<bool> UpdateSchedulesAsync(
        Guid auditoriumId, IReadOnlyCollection<ScheduleUpdate> updates, CancellationToken cancellationToken = default)
    {
        var ids = updates.Select(u => u.ScheduleId).ToList();
        var entities = await _dbContext.MovieScheduleInfoEntity
            .Where(x => x.AuditoriumId == auditoriumId && ids.Contains(x.MovieScheduleInfoId) && !x.IsDeleted)
            .ToListAsync(cancellationToken);

        if (entities.Count != ids.Distinct().Count())
        {
            return false;
        }

        var now = _clock.VietnamNow;
        foreach (var update in updates)
        {
            var entity = entities.First(x => x.MovieScheduleInfoId == update.ScheduleId);
            entity.MovieId = update.MovieId;
            entity.MovieFormatId = update.FormatId;
            entity.ActiveAt = update.StartTime;
            entity.StartTime = update.StartTime;
            entity.EndedTime = update.EndedTime;
            entity.UpdatedByUserId = update.UpdatedByUserId;
            entity.UpdatedAt = now;
        }

        return true;
    }

    public async Task SoftDeleteScheduleAsync(
        Guid scheduleId, Guid deletedByUserId, CancellationToken cancellationToken = default)
    {
        var schedule = await _dbContext.MovieScheduleInfoEntity
            .FirstOrDefaultAsync(x => x.MovieScheduleInfoId == scheduleId, cancellationToken);
        if (schedule == null)
        {
            return;
        }
        schedule.IsDeleted = true;
        schedule.DeletedByUserId = deletedByUserId;
        schedule.DeletedAt = _clock.VietnamNow;
    }
}
