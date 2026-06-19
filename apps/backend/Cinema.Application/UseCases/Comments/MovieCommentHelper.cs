using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.Comments;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Comments;

public static class MovieCommentHelper
{
    public static ResMovieCommentDto MapComment(MovieCommentEntity comment)
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

    public static ResMovieCommentDto MapCommentTree(MovieCommentEntity comment, List<MovieCommentEntity> allComments)
    {
        var dto = MapComment(comment);
        dto.Replies = allComments
            .Where(x => x.ParentCommentId == comment.CommentId)
            .OrderBy(x => x.CreatedAt)
            .Select(x => MapCommentTree(x, allComments))
            .ToList();
        return dto;
    }

    public static async Task CreateNotificationAsync(
        IUnitOfWork unitOfWork,
        Guid userId,
        string title,
        string message,
        string type,
        Guid? relatedCommentId,
        Guid? relatedMovieId)
    {
        await unitOfWork.Repository<UserNotificationEntity>().AddAsync(new UserNotificationEntity
        {
            NotificationId = Guid.NewGuid(),
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            RelatedCommentId = relatedCommentId,
            RelatedMovieId = relatedMovieId,
            CreatedAt = DateTime.UtcNow
        });
    }

    public static async Task<OrderInfoEntity?> FindEligibleViewedOrderAsync(IUnitOfWork unitOfWork, Guid userId, Guid movieId)
    {
        var now = DateTime.UtcNow;
        return await unitOfWork.Repository<OrderInfoEntity>().Query()
            .Include(x => x.OrderDetailsInfo)
            .ThenInclude(x => x.MovieScheduleInfoEntity)
            .Where(x => x.UserId == userId
                        && (x.OrderStatus == OrderStatusEnum.Booked || x.OrderStatus == OrderStatusEnum.Completed)
                        && x.OrderDetailsInfo.Any(d => d.MovieScheduleInfoEntity.MovieId == movieId
                                                       && d.MovieScheduleInfoEntity.EndedTime <= now))
            .OrderByDescending(x => x.OrderDate)
            .FirstOrDefaultAsync();
    }

    public static async Task<bool> HasFuturePaidTicketAsync(IUnitOfWork unitOfWork, Guid userId, Guid movieId)
    {
        var now = DateTime.UtcNow;
        return await unitOfWork.Repository<OrderInfoEntity>().Query()
            .AnyAsync(x => x.UserId == userId
                           && (x.OrderStatus == OrderStatusEnum.Booked || x.OrderStatus == OrderStatusEnum.Completed)
                           && x.OrderDetailsInfo.Any(d => d.MovieScheduleInfoEntity.MovieId == movieId
                                                          && d.MovieScheduleInfoEntity.EndedTime > now));
    }
}
