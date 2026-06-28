using Cinema.Application.Dtos.TheaterManager.ShowtimeRecommendations;
using Cinema.Application.Interfaces.TheaterManager;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Repositories;

public class ShowtimeRecommendationRepository : IShowtimeRecommendationRepository
{
    private readonly CinemaDbContext _dbContext;

    public ShowtimeRecommendationRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> CanManageCinemaAsync(Guid cinemaId, Guid userId, bool isAdmin)
    {
        if (isAdmin)
        {
            return await _dbContext.Set<CinemaInfoEntity>().AnyAsync(x => x.CinemaId == cinemaId && !x.IsDeleted);
        }

        return await _dbContext.Set<CinemaInfoEntity>()
            .AnyAsync(x => x.CinemaId == cinemaId && !x.IsDeleted && x.TheaterManagerId == userId);
    }

    public async Task<List<AuditoriumInfoEntities>> GetAuditoriumsAsync(Guid cinemaId, Guid? auditoriumId)
    {
        var query = _dbContext.Set<AuditoriumInfoEntities>()
            .AsNoTracking()
            .Include(x => x.SeatsInfoEntity)
            .Include(x => x.AuditoriumFormatInfosList)
            .Where(x => x.CinemaId == cinemaId && x.IsActive && !x.IsDeleted);

        if (auditoriumId.HasValue)
        {
            query = query.Where(x => x.AuditoriumId == auditoriumId.Value);
        }

        return await query.ToListAsync();
    }

    public async Task<List<MovieInfoEntity>> GetActiveMoviesForCinemaAsync(Guid cinemaId, DateTime fromUtc, DateTime toUtc)
    {
        return await _dbContext.Set<MovieInfoEntity>()
            .AsNoTracking()
            .Include(x => x.MovieCinemaEntities)
            .Where(x => x.IsActive &&
                        !x.IsDeleted &&
                        x.ActiveAt <= toUtc &&
                        x.EndedDate >= fromUtc.Date &&
                        x.MovieCinemaEntities.Any(mc => mc.CinemaId == cinemaId))
            .ToListAsync();
    }

    public async Task<List<MovieFormatInfoEntity>> GetMovieFormatsAsync()
    {
        return await _dbContext.Set<MovieFormatInfoEntity>().AsNoTracking().ToListAsync();
    }

    public async Task<List<movieFormatMovieInfoEntity>> GetMovieFormatRelationsAsync(IEnumerable<Guid> movieIds)
    {
        var ids = movieIds.ToList();
        return await _dbContext.Set<movieFormatMovieInfoEntity>()
            .AsNoTracking()
            .Where(x => ids.Contains(x.MovieId))
            .ToListAsync();
    }

    public async Task<List<MovieScheduleInfoEntity>> GetSchedulesForCinemaAsync(Guid cinemaId, DateTime fromUtc, DateTime toUtc)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .AsNoTracking()
            .Include(x => x.AuditoriumInfoEntities)
            .Where(x => x.AuditoriumInfoEntities != null &&
                        x.AuditoriumInfoEntities.CinemaId == cinemaId &&
                        !x.IsDeleted &&
                        x.EndedTime.AddMinutes(15) > fromUtc &&
                        x.ActiveAt < toUtc)
            .ToListAsync();
    }

    public async Task<List<OrderDetailsInfo>> GetPaidOrderDetailsForCinemaAsync(Guid cinemaId, DateTime fromUtc, DateTime toUtc)
    {
        var paidStatuses = new[] { OrderStatusEnum.Booked, OrderStatusEnum.Completed };
        return await _dbContext.Set<OrderDetailsInfo>()
            .AsNoTracking()
            .Include(x => x.OrderInfoEntity)
            .Include(x => x.MovieScheduleInfoEntity)
                .ThenInclude(x => x.AuditoriumInfoEntities)
            .Where(x => paidStatuses.Contains(x.OrderInfoEntity.OrderStatus) &&
                        x.OrderInfoEntity.OrderDate >= fromUtc &&
                        x.OrderInfoEntity.OrderDate <= toUtc &&
                        x.MovieScheduleInfoEntity.AuditoriumInfoEntities != null &&
                        x.MovieScheduleInfoEntity.AuditoriumInfoEntities.CinemaId == cinemaId)
            .ToListAsync();
    }

    public async Task<Dictionary<Guid, int>> GetMovieViewCountsAsync(IEnumerable<Guid> movieIds, DateTime fromUtc, DateTime toUtc)
    {
        var ids = movieIds.ToList();
        return await _dbContext.Set<MovieViewEntity>()
            .AsNoTracking()
            .Where(x => ids.Contains(x.MovieId) && x.ViewedAt >= fromUtc && x.ViewedAt <= toUtc)
            .GroupBy(x => x.MovieId)
            .Select(x => new { MovieId = x.Key, Count = x.Count() })
            .ToDictionaryAsync(x => x.MovieId, x => x.Count);
    }

    public async Task<Dictionary<Guid, (decimal Average, int Count)>> GetMovieRatingsAsync(IEnumerable<Guid> movieIds)
    {
        var ids = movieIds.ToList();
        var rows = await _dbContext.Set<MovieCommentEntity>()
            .AsNoTracking()
            .Where(x => ids.Contains(x.MovieId) &&
                        x.ParentCommentId == null &&
                        x.Rating.HasValue &&
                        x.Status == MovieCommentStatusEnum.Visible)
            .GroupBy(x => x.MovieId)
            .Select(x => new
            {
                MovieId = x.Key,
                Average = x.Average(y => y.Rating!.Value),
                Count = x.Count()
            })
            .ToListAsync();

        return rows.ToDictionary(x => x.MovieId, x => ((decimal)x.Average, x.Count));
    }

    public async Task<ShowtimeRecommendationBatchEntity?> GetBatchWithItemsAsync(Guid batchId)
    {
        return await _dbContext.Set<ShowtimeRecommendationBatchEntity>()
            .Include(x => x.Items)
                .ThenInclude(x => x.MovieInfoEntity)
            .Include(x => x.Items)
                .ThenInclude(x => x.MovieFormatInfoEntity)
            .Include(x => x.Items)
                .ThenInclude(x => x.AuditoriumInfoEntity)
            .FirstOrDefaultAsync(x => x.BatchId == batchId);
    }

    public async Task<List<ShowtimeRecommendationItemEntity>> GetItemsAsync(Guid batchId, IEnumerable<Guid> recommendationIds)
    {
        var ids = recommendationIds.ToList();
        var query = _dbContext.Set<ShowtimeRecommendationItemEntity>()
            .Include(x => x.Batch)
            .Include(x => x.MovieInfoEntity)
            .Include(x => x.MovieFormatInfoEntity)
            .Include(x => x.AuditoriumInfoEntity)
            .AsQueryable();

        if (batchId != Guid.Empty)
        {
            query = query.Where(x => x.BatchId == batchId);
        }

        if (ids.Count > 0)
        {
            query = query.Where(x => ids.Contains(x.RecommendationId));
        }

        return await query.ToListAsync();
    }

    public async Task AddBatchAsync(ShowtimeRecommendationBatchEntity batch)
    {
        await _dbContext.Set<ShowtimeRecommendationBatchEntity>().AddAsync(batch);
    }

    public async Task AddSchedulesAsync(IEnumerable<MovieScheduleInfoEntity> schedules)
    {
        await _dbContext.Set<MovieScheduleInfoEntity>().AddRangeAsync(schedules);
    }

    public async Task AddActionAsync(ShowtimeRecommendationActionEntity action)
    {
        await _dbContext.Set<ShowtimeRecommendationActionEntity>().AddAsync(action);
    }

    public async Task<List<ShowtimeRecommendationHistoryDto>> GetHistoryAsync(Guid cinemaId, Guid userId, bool isAdmin, int take)
    {
        var query = _dbContext.Set<ShowtimeRecommendationBatchEntity>()
            .AsNoTracking()
            .Include(x => x.Items)
            .Where(x => x.CinemaId == cinemaId);

        if (!isAdmin)
        {
            query = query.Where(x => x.RequestedByUserId == userId);
        }

        return await query
            .OrderByDescending(x => x.CreatedAt)
            .Take(take)
            .Select(x => new ShowtimeRecommendationHistoryDto
            {
                BatchId = x.BatchId,
                CinemaId = x.CinemaId,
                FromDate = x.FromDate,
                ToDate = x.ToDate,
                CreatedAt = x.CreatedAt,
                SuggestedCount = x.Items.Count,
                AppliedCount = x.Items.Count(i => i.Status == ShowtimeRecommendationStatusEnum.Applied),
                DismissedCount = x.Items.Count(i => i.Status == ShowtimeRecommendationStatusEnum.Dismissed)
            })
            .ToListAsync();
    }
}

