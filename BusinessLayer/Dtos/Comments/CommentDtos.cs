using System.ComponentModel.DataAnnotations;
using Shared.Enums;

namespace BusinessLayer.Dtos.Comments;

public class ReqCreateMovieCommentDto
{
    [Required]
    [StringLength(1000, MinimumLength = 2)]
    public string Content { get; set; } = string.Empty;

    [Range(1, 5)]
    public int Rating { get; set; }
}

public class ReqCreateMovieReplyDto
{
    [Required]
    [StringLength(1000, MinimumLength = 2)]
    public string Content { get; set; } = string.Empty;
}

public class ResMovieCommentDto
{
    public Guid CommentId { get; set; }
    public Guid MovieId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatarUrl { get; set; }
    public Guid? ParentCommentId { get; set; }
    public int? Rating { get; set; }
    public string Content { get; set; } = string.Empty;
    public MovieCommentStatusEnum Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<ResMovieCommentDto> Replies { get; set; } = [];
}

public class ResMovieCommentsSummaryDto
{
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public List<ResMovieCommentDto> Comments { get; set; } = [];
}

public class ResCommentEligibilityDto
{
    public CommentEligibilityStatusEnum Status { get; set; }
    public bool CanComment { get; set; }
    public string Message { get; set; } = string.Empty;
    public Guid? OrderId { get; set; }
}

public class ResUserNotificationDto
{
    public Guid NotificationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public Guid? RelatedCommentId { get; set; }
    public Guid? RelatedMovieId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ResTrendingMovieDto
{
    public Guid MovieId { get; set; }
    public string MovieName { get; set; } = string.Empty;
    public string MovieImageUrl { get; set; } = string.Empty;
    public string MovieDescription { get; set; } = string.Empty;
    public int MovieDuration { get; set; }
    public string MovieRequiredAgeSymbol { get; set; } = string.Empty;
    public int PaidTicketCount { get; set; }
    public int ViewCount { get; set; }
    public double AverageRating { get; set; }
    public double TrendingScore { get; set; }
}

