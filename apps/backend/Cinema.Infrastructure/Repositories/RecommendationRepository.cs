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
using Cinema.Domain.Enums;

namespace Cinema.Infrastructure.Repositories;

public class RecommendationRepository : IRecommendationRepository
{
    private readonly CinemaDbContext _dbContext;

    public RecommendationRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
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
        return await _dbContext.Set<MovieViewEntity>()
            .Where(x => x.UserId == userId)
            .GroupBy(x => x.MovieId)
            .Select(x => new MovieBehaviorSignal(x.Key, x.Count(), x.Max(v => v.ViewedAt)))
            .OrderByDescending(x => x.Count)
            .ThenByDescending(x => x.LastAt)
            .Take(take)
            .ToListAsync();
    }

    public async Task<List<MovieBehaviorSignal>> GetBookedMovieSignalsAsync(Guid userId, int take)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .Where(x => x.OrderInfoEntity.UserId == userId
                        && (x.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked
                            || x.OrderInfoEntity.OrderStatus == OrderStatusEnum.Completed))
            .GroupBy(x => x.MovieScheduleInfoEntity.MovieId)
            .Select(x => new MovieBehaviorSignal(x.Key, x.Count(), x.Max(d => d.OrderInfoEntity.OrderDate)))
            .OrderByDescending(x => x.Count)
            .ThenByDescending(x => x.LastAt)
            .Take(take)
            .ToListAsync();
    }

    public async Task<List<MovieBehaviorSignal>> GetPositiveRatingSignalsAsync(Guid userId, int take)
    {
        return await _dbContext.Set<MovieCommentEntity>()
            .Where(x => x.UserId == userId
                        && x.ParentCommentId == null
                        && x.Rating.HasValue
                        && x.Rating.Value >= 4
                        && x.Status != MovieCommentStatusEnum.Deleted
                        && x.Status != MovieCommentStatusEnum.Rejected)
            .GroupBy(x => x.MovieId)
            .Select(x => new MovieBehaviorSignal(x.Key, x.Count(), x.Max(c => c.CreatedAt)))
            .OrderByDescending(x => x.Count)
            .ThenByDescending(x => x.LastAt)
            .Take(take)
            .ToListAsync();
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
        return await _dbContext.Set<MovieInfoEntity>()
            .Where(m => movieIds.Contains(m.MovieId) && !m.IsDeleted && (m.IsActive || m.IsCommingSoon))
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
        var movies = await _dbContext.Set<MovieInfoEntity>()
            .Where(m => !m.IsDeleted
                        && (m.IsActive || m.IsCommingSoon)
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

    public async Task<List<MovieInfoEntity>> GetActiveMoviesForEmbeddingAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.Set<MovieInfoEntity>()
            .Include(m => m.MovieGenreMovieInfoEntity)
            .ThenInclude(g => g.MovieGenreInfoEntity)
            .Where(m => !m.IsDeleted && (m.IsActive || m.IsCommingSoon))
            .ToListAsync(cancellationToken);
    }

    public async Task<MovieInfoEntity?> GetMovieForEmbeddingAsync(Guid movieId, CancellationToken cancellationToken)
    {
        return await _dbContext.Set<MovieInfoEntity>()
            .Include(m => m.MovieGenreMovieInfoEntity)
            .ThenInclude(g => g.MovieGenreInfoEntity)
            .Where(m => m.MovieId == movieId)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
