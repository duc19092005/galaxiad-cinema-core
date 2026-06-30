using System;
using System.Collections.Generic;
using System.Linq;
using Cinema.Application.Dtos.Comments;
using Cinema.Domain.Entities.MovieInfos;

namespace Cinema.Application.UseCases.Customer.Engagement.Comments;

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
}

