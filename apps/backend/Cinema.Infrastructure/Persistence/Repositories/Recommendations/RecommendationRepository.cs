using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Comments;
using System.Text.Json;
using StackExchange.Redis;
using Cinema.Domain.Enums;

namespace Cinema.Infrastructure.Persistence.Repositories.Recommendations;

public class RecommendationRepository : IRecommendationRepository
{
    private readonly CinemaDbContext _dbContext;
    private readonly IConnectionMultiplexer _redis;

    public RecommendationRepository(CinemaDbContext dbContext, IConnectionMultiplexer redis)
    {
        _dbContext = dbContext;
        _redis = redis;
    }

    public async Task<UserGenreSurveyEntity?> GetSurveyByUserIdAsync(Guid userId)
    {
        return await _dbContext.Set<UserGenreSurveyEntity>()
            .FirstOrDefaultAsync(x => x.UserId == userId);
    }

    public async Task AddSurveyAsync(UserGenreSurveyEntity survey)
    {
        await _dbContext.Set<UserGenreSurveyEntity>().AddAsync(survey);
    }

    public async Task UpdateSurveyAsync(UserGenreSurveyEntity survey)
    {
        _dbContext.Set<UserGenreSurveyEntity>().Update(survey);
        await Task.CompletedTask;
    }

    public async Task<List<string>> GetMovieGenreNamesAsync(List<string> genreIds)
    {
        return await _dbContext.Set<MovieGenreInfoEntity>()
            .Where(g => genreIds.Contains(g.MovieGenreId.ToString()))
            .Select(g => g.MovieGenreName)
            .ToListAsync();
    }

    public async Task<List<MovieBehaviorSignal>> GetViewedMovieSignalsAsync(Guid userId, int take)
    {
        // 1. Query database for historical view signals
        var dbSignals = await _dbContext.Set<MovieViewEntity>()
            .Where(x => x.UserId == userId)
            .GroupBy(x => x.MovieId)
            .Select(x => new { MovieId = x.Key, Count = x.Count(), LastAt = x.Max(v => v.ViewedAt) })
            .ToListAsync();

        var dbSignalList = dbSignals.Select(x => new MovieBehaviorSignal(x.MovieId, x.Count, x.LastAt)).ToList();

        // 2. Query Redis for buffered view signals (bounded read: last 500 entries)
        var redisDb = _redis.GetDatabase();
        var rawRedis = await redisDb.ListRangeAsync("cinema:movie_views_queue", 0, 499);
        var redisViews = new List<RedisMovieViewDto>();

        foreach (var item in rawRedis)
        {
            try
            {
                var dto = JsonSerializer.Deserialize<RedisMovieViewDto>(item.ToString());
                if (dto != null && dto.UserId == userId)
                {
                    redisViews.Add(dto);
                }
            }
            catch
            {
                // Ignore parse/deserialization errors on malformed payloads
            }
        }

        var redisSignalList = redisViews
            .GroupBy(x => x.MovieId)
            .Select(g => new MovieBehaviorSignal(g.Key, g.Count(), g.Max(x => x.ViewedAt)))
            .ToList();

        // 3. Merge both signal lists in-memory
        var combined = dbSignalList
            .Concat(redisSignalList)
            .GroupBy(x => x.MovieId)
            .Select(g => new MovieBehaviorSignal(
                g.Key,
                g.Sum(x => x.Count),
                g.Max(x => x.LastAt)
            ))
            .OrderByDescending(x => x.Count)
            .ThenByDescending(x => x.LastAt)
            .Take(take)
            .ToList();

        return combined;
    }

    public async Task<List<MovieBehaviorSignal>> GetBookedMovieSignalsAsync(Guid userId, int take)
    {
        var raw = await _dbContext.Set<OrderDetailsInfo>()
            .Where(x => x.OrderInfoEntity.UserId == userId
                        && (x.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked
                            || x.OrderInfoEntity.OrderStatus == OrderStatusEnum.Completed))
            .GroupBy(x => x.MovieScheduleInfoEntity.MovieId)
            .Select(x => new { MovieId = x.Key, Count = x.Count(), LastAt = x.Max(d => d.OrderInfoEntity.OrderDate) })
            .OrderByDescending(x => x.Count)
            .ThenByDescending(x => x.LastAt)
            .Take(take)
            .ToListAsync();

        return raw.Select(x => new MovieBehaviorSignal(x.MovieId, x.Count, x.LastAt)).ToList();
    }

    public async Task<List<MovieBehaviorSignal>> GetPositiveRatingSignalsAsync(Guid userId, int take)
    {
        var raw = await _dbContext.Set<MovieCommentEntity>()
            .Where(x => x.UserId == userId
                        && x.ParentCommentId == null
                        && x.Rating.HasValue
                        && x.Rating.Value >= 4
                        && x.Status != MovieCommentStatusEnum.Deleted
                        && x.Status != MovieCommentStatusEnum.Rejected)
            .GroupBy(x => x.MovieId)
            .Select(x => new { MovieId = x.Key, Count = x.Count(), LastAt = x.Max(c => c.CreatedAt) })
            .OrderByDescending(x => x.Count)
            .ThenByDescending(x => x.LastAt)
            .Take(take)
            .ToListAsync();

        return raw.Select(x => new MovieBehaviorSignal(x.MovieId, x.Count, x.LastAt)).ToList();
    }

    public async Task<List<MovieBehaviorSignal>> GetRecentPositiveRatingSignalsAsync(Guid userId, DateTime since, int take)
    {
        var raw = await _dbContext.Set<MovieCommentEntity>()
            .Where(x => x.UserId == userId
                        && x.ParentCommentId == null
                        && x.Rating.HasValue
                        && x.Rating.Value >= 4
                        && x.CreatedAt >= since
                        && x.Status != MovieCommentStatusEnum.Deleted
                        && x.Status != MovieCommentStatusEnum.Rejected)
            .GroupBy(x => x.MovieId)
            .Select(x => new { MovieId = x.Key, Count = x.Count(), LastAt = x.Max(c => c.CreatedAt) })
            .OrderByDescending(x => x.LastAt)
            .ThenByDescending(x => x.Count)
            .Take(take)
            .ToListAsync();

        return raw.Select(x => new MovieBehaviorSignal(x.MovieId, x.Count, x.LastAt)).ToList();
    }

    public async Task<List<MovieBehaviorSignal>> GetHighQualityInteractionSignalsAsync(Guid userId, double minAverageRating, int take)
    {
        var interacted = (await GetBookedMovieSignalsAsync(userId, 20))
            .Concat(await GetViewedMovieSignalsAsync(userId, 20))
            .Concat(await GetPositiveRatingSignalsAsync(userId, 20))
            .GroupBy(x => x.MovieId)
            .Select(g => new MovieBehaviorSignal(
                g.Key,
                g.Sum(x => x.Count),
                g.Max(x => x.LastAt)))
            .ToList();

        if (interacted.Count == 0)
        {
            return [];
        }

        var interactedIds = interacted.Select(x => x.MovieId).ToList();
        var communityRatings = await _dbContext.Set<MovieCommentEntity>()
            .Where(x => interactedIds.Contains(x.MovieId)
                        && x.ParentCommentId == null
                        && x.Rating.HasValue
                        && x.Status == MovieCommentStatusEnum.Visible)
            .GroupBy(x => x.MovieId)
            .Select(x => new { MovieId = x.Key, Average = x.Average(c => c.Rating!.Value), Count = x.Count() })
            .ToDictionaryAsync(x => x.MovieId, x => new { x.Average, x.Count });

        return interacted
            .Where(x => communityRatings.TryGetValue(x.MovieId, out var rating)
                        && rating.Average >= minAverageRating)
            .OrderByDescending(x => communityRatings[x.MovieId].Average)
            .ThenByDescending(x => x.Count)
            .ThenByDescending(x => x.LastAt)
            .Take(take)
            .ToList();
    }

    public async Task<List<GenrePreferenceSignal>> GetDominantGenreSignalsAsync(Guid userId, double majorityThreshold, int take)
    {
        var behaviorSignals = (await GetBookedMovieSignalsAsync(userId, 30))
            .Select(x => new MovieBehaviorSignal(x.MovieId, x.Count * 3, x.LastAt))
            .Concat(await GetViewedMovieSignalsAsync(userId, 30))
            .GroupBy(x => x.MovieId)
            .Select(g => new MovieBehaviorSignal(
                g.Key,
                g.Sum(x => x.Count),
                g.Max(x => x.LastAt)))
            .ToList();

        if (behaviorSignals.Count == 0)
        {
            return [];
        }

        var scoreByMovieId = behaviorSignals.ToDictionary(x => x.MovieId, x => (double)x.Count);
        var movieIds = scoreByMovieId.Keys.ToList();
        var movies = await _dbContext.Set<MovieInfoEntity>()
            .Include(m => m.MovieGenreMovieInfoEntity)
            .ThenInclude(g => g.MovieGenreInfoEntity)
            .AsNoTracking()
            .Where(m => movieIds.Contains(m.MovieId) && !m.IsDeleted)
            .ToListAsync();

        var genreScores = movies
            .SelectMany(movie => movie.MovieGenreMovieInfoEntity.Select(genre => new
            {
                GenreName = genre.MovieGenreInfoEntity.MovieGenreName,
                Score = scoreByMovieId.GetValueOrDefault(movie.MovieId)
            }))
            .GroupBy(x => x.GenreName)
            .Select(g => new GenrePreferenceSignal(g.Key, g.Sum(x => x.Score)))
            .OrderByDescending(x => x.Weight)
            .ToList();

        if (genreScores.Count == 0)
        {
            return [];
        }

        var maxScore = genreScores[0].Weight;
        return genreScores
            .Where(x => maxScore <= 0 || x.Weight >= maxScore * majorityThreshold)
            .Take(take)
            .ToList();
    }

    public async Task<List<string>> LoadMoviePreferenceSnippetsAsync(IEnumerable<Guid> movieIds)
    {
        var ids = movieIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return [];
        }

        var movies = await _dbContext.Set<MovieInfoEntity>()
            .Include(m => m.MovieGenreMovieInfoEntity)
            .ThenInclude(g => g.MovieGenreInfoEntity)
            .AsNoTracking()
            .Where(m => ids.Contains(m.MovieId) && !m.IsDeleted)
            .ToListAsync();

        return movies
            .Select(m => $"Movie: {m.MovieName}; genres: {string.Join(", ", m.MovieGenreMovieInfoEntity.Select(g => g.MovieGenreInfoEntity.MovieGenreName))}; director: {m.Director}; actors: {m.Actors}")
            .ToList();
    }

    public async Task<List<RecommendedMovieRes>> LoadRecommendedMoviesAsync(List<Guid> movieIds)
    {
        var now = DateTime.UtcNow;
        return await _dbContext.Set<MovieInfoEntity>()
            .Where(m => movieIds.Contains(m.MovieId) && !m.IsDeleted && (m.IsActive || m.IsCommingSoon) && m.ActiveAt <= now && now <= m.EndedDate)
            .Select(m => new RecommendedMovieRes
            {
                MovieId = m.MovieId,
                MovieName = m.MovieName,
                MoviePosterURL = m.MovieImageUrl,
                MovieBannerURL = m.MovieBannerUrl,
                MovieDescription = m.MovieDescription,
                MovieGenres = string.Join(", ", m.MovieGenreMovieInfoEntity.Select(g => g.MovieGenreInfoEntity.MovieGenreName)),
                MovieFormatInfos = string.Join(", ", m.MovieFormatMovieInfoEntity.Select(f => f.MovieFormatInfoEntity.MovieFormatName)),
                MovieRequiredAge = m.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.TrimEnd().TrimStart(),
                MovieDuration = m.MovieDuration,
                IsCommingSoon = m.IsCommingSoon,
                SimilarityScore = 0
            })
            .ToListAsync();
    }

    public async Task<List<RecommendedMovieRes>> GetFallbackRecommendationsAsync(HashSet<Guid> excludedMovieIds, int take)
    {
        if (take <= 0)
        {
            return [];
        }

        var excludedIds = excludedMovieIds.ToList();
        var now = DateTime.UtcNow;
        var movies = await _dbContext.Set<MovieInfoEntity>()
            .Where(m => !m.IsDeleted
                        && (m.IsActive || m.IsCommingSoon)
                        && m.ActiveAt <= now
                        && now <= m.EndedDate
                        && !excludedIds.Contains(m.MovieId))
            .Select(m => new RecommendedMovieRes
            {
                MovieId = m.MovieId,
                MovieName = m.MovieName,
                MoviePosterURL = m.MovieImageUrl,
                MovieBannerURL = m.MovieBannerUrl,
                MovieDescription = m.MovieDescription,
                MovieGenres = string.Join(", ", m.MovieGenreMovieInfoEntity.Select(g => g.MovieGenreInfoEntity.MovieGenreName)),
                MovieFormatInfos = string.Join(", ", m.MovieFormatMovieInfoEntity.Select(f => f.MovieFormatInfoEntity.MovieFormatName)),
                MovieRequiredAge = m.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.TrimEnd().TrimStart(),
                MovieDuration = m.MovieDuration,
                IsCommingSoon = m.IsCommingSoon,
                SimilarityScore = 0
            })
            .ToListAsync();

        var since = DateTime.UtcNow.AddDays(-30);
        var viewCounts = await _dbContext.Set<MovieViewEntity>()
            .Where(x => x.ViewedAt >= since)
            .GroupBy(x => x.MovieId)
            .Select(x => new { MovieId = x.Key, Count = x.Count() })
            .ToDictionaryAsync(x => x.MovieId, x => x.Count);

        var bookingCounts = await _dbContext.Set<OrderDetailsInfo>()
            .Where(x => x.OrderInfoEntity.OrderDate >= since
                        && (x.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked
                            || x.OrderInfoEntity.OrderStatus == OrderStatusEnum.Completed))
            .GroupBy(x => x.MovieScheduleInfoEntity.MovieId)
            .Select(x => new { MovieId = x.Key, Count = x.Count() })
            .ToDictionaryAsync(x => x.MovieId, x => x.Count);

        var ratingScores = await _dbContext.Set<MovieCommentEntity>()
            .Where(x => x.ParentCommentId == null
                        && x.Rating.HasValue
                        && x.Status == MovieCommentStatusEnum.Visible)
            .GroupBy(x => x.MovieId)
            .Select(x => new { MovieId = x.Key, Average = x.Average(c => c.Rating!.Value), Count = x.Count() })
            .ToDictionaryAsync(x => x.MovieId, x => new { x.Average, x.Count });

        return movies
            .Select(movie =>
            {
                var rating = ratingScores.GetValueOrDefault(movie.MovieId);
                movie.SimilarityScore =
                    bookingCounts.GetValueOrDefault(movie.MovieId) * 3
                    + viewCounts.GetValueOrDefault(movie.MovieId)
                    + (rating?.Average ?? 0) * 10
                    + (rating?.Count ?? 0);
                return movie;
            })
            .OrderByDescending(movie => movie.SimilarityScore)
            .ThenBy(movie => movie.IsCommingSoon)
            .Take(take)
            .ToList();
    }

    public async Task<List<AiMovieItem>> GetActiveMoviesForEmbeddingAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var movieData = await _dbContext.Set<MovieInfoEntity>()
            .AsNoTracking()
            .Where(m => !m.IsDeleted && (m.IsActive || m.IsCommingSoon) && now <= m.EndedDate)
            .Select(m => new
            {
                MovieId = m.MovieId,
                MovieName = m.MovieName,
                MovieDescription = m.MovieDescription,
                Director = m.Director,
                Actors = m.Actors,
                Genres = m.MovieGenreMovieInfoEntity.Select(g => g.MovieGenreInfoEntity.MovieGenreName).ToList()
            })
            .ToListAsync(cancellationToken);

        return movieData.Select(m => new AiMovieItem
        {
            MovieId = m.MovieId.ToString(),
            EmbeddingText = $"Tên phim: {m.MovieName}. Thể loại: {string.Join(", ", m.Genres)}. Mô tả: {m.MovieDescription}. Đạo diễn: {m.Director}. Diễn viên: {m.Actors}"
        }).ToList();
    }

    public async Task<AiMovieItem?> GetMovieForEmbeddingAsync(Guid movieId, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var m = await _dbContext.Set<MovieInfoEntity>()
            .AsNoTracking()
            .Where(m => m.MovieId == movieId && !m.IsDeleted && (m.IsActive || m.IsCommingSoon) && now <= m.EndedDate)
            .Select(m => new
            {
                MovieId = m.MovieId,
                MovieName = m.MovieName,
                MovieDescription = m.MovieDescription,
                Director = m.Director,
                Actors = m.Actors,
                Genres = m.MovieGenreMovieInfoEntity.Select(g => g.MovieGenreInfoEntity.MovieGenreName).ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (m == null) return null;

        return new AiMovieItem
        {
            MovieId = m.MovieId.ToString(),
            EmbeddingText = $"Tên phim: {m.MovieName}. Thể loại: {string.Join(", ", m.Genres)}. Mô tả: {m.MovieDescription}. Đạo diễn: {m.Director}. Diễn viên: {m.Actors}"
        };
    }
}
