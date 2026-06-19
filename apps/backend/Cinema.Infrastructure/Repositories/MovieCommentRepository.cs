using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.Comments;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Comments;
using Cinema.Domain.Enums;

namespace Cinema.Infrastructure.Repositories;

public class MovieCommentRepository : IMovieCommentRepository
{
    private readonly CinemaDbContext _dbContext;

    public MovieCommentRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ResMovieCommentsSummaryDto> GetMovieCommentsSummaryAsync(Guid movieId)
    {
        var comments = await _dbContext.Set<MovieCommentEntity>()
            .Where(x => x.MovieId == movieId && x.Status == MovieCommentStatusEnum.Visible)
            .Include(x => x.UserInfoEntity)
            .OrderByDescending(x => x.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        var rootComments = comments
            .Where(x => x.ParentCommentId == null)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => MapCommentTree(x, comments))
            .ToList();

        var rootReviews = comments.Where(x => x.ParentCommentId == null && x.Rating.HasValue).ToList();

        return new ResMovieCommentsSummaryDto
        {
            AverageRating = rootReviews.Count == 0 ? 0 : Math.Round(rootReviews.Average(x => x.Rating!.Value), 1),
            ReviewCount = rootReviews.Count,
            Comments = rootComments
        };
    }

    public async Task<OrderInfoEntity?> FindEligibleViewedOrderAsync(Guid userId, Guid movieId)
    {
        var now = DateTime.UtcNow;
        return await _dbContext.Set<OrderInfoEntity>()
            .Include(x => x.OrderDetailsInfo)
            .ThenInclude(x => x.MovieScheduleInfoEntity)
            .Where(x => x.UserId == userId
                        && (x.OrderStatus == OrderStatusEnum.Booked || x.OrderStatus == OrderStatusEnum.Completed)
                        && x.OrderDetailsInfo.Any(d => d.MovieScheduleInfoEntity.MovieId == movieId
                                                       && d.MovieScheduleInfoEntity.EndedTime <= now))
            .OrderByDescending(x => x.OrderDate)
            .FirstOrDefaultAsync();
    }

    public async Task<bool> HasFuturePaidTicketAsync(Guid userId, Guid movieId)
    {
        var now = DateTime.UtcNow;
        return await _dbContext.Set<OrderInfoEntity>()
            .AnyAsync(x => x.UserId == userId
                           && (x.OrderStatus == OrderStatusEnum.Booked || x.OrderStatus == OrderStatusEnum.Completed)
                           && x.OrderDetailsInfo.Any(d => d.MovieScheduleInfoEntity.MovieId == movieId
                                                          && d.MovieScheduleInfoEntity.EndedTime > now));
    }

    public async Task<bool> HasAlreadyReviewedAsync(Guid userId, Guid movieId)
    {
        return await _dbContext.Set<MovieCommentEntity>()
            .AnyAsync(x => x.MovieId == movieId
                           && x.UserId == userId
                           && x.ParentCommentId == null
                           && x.Status != MovieCommentStatusEnum.Deleted
                           && x.Status != MovieCommentStatusEnum.Rejected);
    }

    public async Task<MovieCommentEntity?> GetCommentWithUserAndMovieAsync(Guid commentId)
    {
        return await _dbContext.Set<MovieCommentEntity>()
            .Include(x => x.UserInfoEntity)
            .Include(x => x.MovieInfoEntity)
            .Include(x => x.ParentComment)
            .FirstOrDefaultAsync(x => x.CommentId == commentId);
    }

    public async Task<List<ResUserNotificationDto>> GetNotificationsByUserIdAsync(Guid userId)
    {
        return await _dbContext.Set<UserNotificationEntity>()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .Select(x => new ResUserNotificationDto
            {
                NotificationId = x.NotificationId,
                Title = x.Title,
                Message = x.Message,
                Type = x.Type,
                RelatedCommentId = x.RelatedCommentId,
                RelatedMovieId = x.RelatedMovieId,
                IsRead = x.IsRead,
                CreatedAt = x.CreatedAt
            })
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<UserNotificationEntity?> GetNotificationByIdAndUserAsync(Guid notificationId, Guid userId)
    {
        return await _dbContext.Set<UserNotificationEntity>()
            .FirstOrDefaultAsync(x => x.NotificationId == notificationId && x.UserId == userId);
    }

    public async Task<List<ResTrendingMovieDto>> GetTrendingMoviesAsync(DateTime fromDate, Guid? cinemaId, string? city)
    {
        var moviesQuery = _dbContext.Set<MovieInfoEntity>()
            .Where(x => !x.IsDeleted && x.IsActive);

        if (cinemaId.HasValue)
        {
            moviesQuery = moviesQuery.Where(x => x.MovieCinemaEntities.Any(mc => mc.CinemaId == cinemaId.Value));
        }
        else if (!string.IsNullOrEmpty(city))
        {
            moviesQuery = moviesQuery.Where(x => x.MovieCinemaEntities.Any(mc => mc.CinemaInfoEntity.CinemaCity.ToLower() == city.ToLower()));
        }

        var movies = await moviesQuery
            .Select(x => new ResTrendingMovieDto
            {
                MovieId = x.MovieId,
                MovieName = x.MovieName,
                MovieImageUrl = x.MovieImageUrl,
                MovieBannerUrl = x.MovieBannerUrl,
                MovieDescription = x.MovieDescription,
                MovieDuration = x.MovieDuration,
                MovieRequiredAgeSymbol = x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.Trim()
            })
            .AsNoTracking()
            .ToListAsync();

        var ticketsQuery = _dbContext.Set<OrderDetailsInfo>()
            .Where(x => x.OrderInfoEntity.OrderDate >= fromDate
                        && (x.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked
                            || x.OrderInfoEntity.OrderStatus == OrderStatusEnum.Completed));

        if (cinemaId.HasValue)
        {
            ticketsQuery = ticketsQuery.Where(x => x.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaId == cinemaId.Value);
        }
        else if (!string.IsNullOrEmpty(city))
        {
            ticketsQuery = ticketsQuery.Where(x => x.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaInfoEntity.CinemaCity.ToLower() == city.ToLower());
        }

        var paidTicketCounts = await ticketsQuery
            .GroupBy(x => x.MovieScheduleInfoEntity.MovieId)
            .Select(x => new { MovieId = x.Key, Count = x.Count() })
            .ToDictionaryAsync(x => x.MovieId, x => x.Count);

        var viewCounts = await _dbContext.Set<MovieViewEntity>()
            .Where(x => x.ViewedAt >= fromDate)
            .GroupBy(x => x.MovieId)
            .Select(x => new { MovieId = x.Key, Count = x.Count() })
            .ToDictionaryAsync(x => x.MovieId, x => x.Count);

        var ratingInfos = await _dbContext.Set<MovieCommentEntity>()
            .Where(x => x.ParentCommentId == null
                        && x.Rating.HasValue
                        && x.Status == MovieCommentStatusEnum.Visible)
            .GroupBy(x => x.MovieId)
            .Select(x => new { MovieId = x.Key, Average = x.Average(c => c.Rating!.Value), Count = x.Count() })
            .ToDictionaryAsync(x => x.MovieId, x => new { Average = Math.Round(x.Average, 1), Count = x.Count });

        var result = movies
            .Select(movie =>
            {
                movie.PaidTicketCount = paidTicketCounts.GetValueOrDefault(movie.MovieId);
                movie.ViewCount = viewCounts.GetValueOrDefault(movie.MovieId);
                var ratingInfo = ratingInfos.GetValueOrDefault(movie.MovieId);
                movie.AverageRating = ratingInfo?.Average ?? 0.0;
                movie.RatingCount = ratingInfo?.Count ?? 0;
                movie.TrendingScore = Math.Round(movie.PaidTicketCount * 3 + movie.ViewCount + movie.AverageRating * 10, 1);
                return movie;
            })
            .Where(x => x.TrendingScore > 0)
            .OrderByDescending(x => x.TrendingScore)
            .ThenByDescending(x => x.PaidTicketCount)
            .ToList();

        return result;
    }

    public async Task<List<ResTrendingMovieDto>> GetTopRatedMoviesAsync(Guid? cinemaId)
    {
        var query = _dbContext.Set<MovieInfoEntity>()
            .Where(x => !x.IsDeleted && x.IsActive);

        if (cinemaId.HasValue)
        {
            query = query.Where(x => x.MovieCinemaEntities.Any(mc => mc.CinemaId == cinemaId.Value));
        }

        var movies = await query
            .Select(x => new ResTrendingMovieDto
            {
                MovieId = x.MovieId,
                MovieName = x.MovieName,
                MovieImageUrl = x.MovieImageUrl,
                MovieBannerUrl = x.MovieBannerUrl,
                MovieDescription = x.MovieDescription,
                MovieDuration = x.MovieDuration,
                MovieRequiredAgeSymbol = x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.Trim()
            })
            .AsNoTracking()
            .ToListAsync();

        var ratingAverages = await _dbContext.Set<MovieCommentEntity>()
            .Where(x => x.ParentCommentId == null
                        && x.Rating.HasValue
                        && x.Status == MovieCommentStatusEnum.Visible)
            .GroupBy(x => x.MovieId)
            .Select(x => new { MovieId = x.Key, Average = x.Average(c => c.Rating!.Value), Count = x.Count() })
            .ToDictionaryAsync(x => x.MovieId, x => new { Average = Math.Round(x.Average, 1), Count = x.Count });

        var viewCounts = await _dbContext.Set<MovieViewEntity>()
            .GroupBy(x => x.MovieId)
            .Select(x => new { MovieId = x.Key, Count = x.Count() })
            .ToDictionaryAsync(x => x.MovieId, x => x.Count);

        var result = movies
            .Select(movie =>
            {
                var ratingInfo = ratingAverages.GetValueOrDefault(movie.MovieId);
                movie.AverageRating = ratingInfo?.Average ?? 0.0;
                movie.RatingCount = ratingInfo?.Count ?? 0;
                movie.ViewCount = viewCounts.GetValueOrDefault(movie.MovieId);
                return movie;
            })
            .Where(x => x.RatingCount > 0)
            .OrderByDescending(x => x.AverageRating)
            .ThenByDescending(x => x.RatingCount)
            .ToList();

        return result;
    }

    public async Task<bool> MovieExistsAsync(Guid movieId)
    {
        return await _dbContext.Set<MovieInfoEntity>()
            .AnyAsync(x => x.MovieId == movieId && !x.IsDeleted);
    }

    public async Task<MovieCommentEntity?> FindCommentAsync(Guid commentId)
    {
        return await _dbContext.Set<MovieCommentEntity>().FindAsync(commentId);
    }

    private static ResMovieCommentDto MapCommentTree(MovieCommentEntity comment, List<MovieCommentEntity> allComments)
    {
        var dto = MapComment(comment);
        dto.Replies = allComments
            .Where(x => x.ParentCommentId == comment.CommentId)
            .OrderBy(x => x.CreatedAt)
            .Select(x => MapCommentTree(x, allComments))
            .ToList();
        return dto;
    }

    private static ResMovieCommentDto MapComment(MovieCommentEntity comment)
    {
        return new ResMovieCommentDto
        {
            CommentId = comment.CommentId,
            MovieId = comment.MovieId,
            UserId = comment.UserId,
            UserName = comment.UserInfoEntity?.UserName ?? string.Empty,
            UserAvatarUrl = comment.UserInfoEntity?.PortraitImageUrl,
            ParentCommentId = comment.ParentCommentId,
            Rating = comment.Rating,
            Content = comment.Content,
            Status = comment.Status,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt
        };
    }
}
