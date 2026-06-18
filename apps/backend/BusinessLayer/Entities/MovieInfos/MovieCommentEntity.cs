using System.ComponentModel.DataAnnotations.Schema;
using BusinessLayer.Entities.UserInfos;
using Shared.Enums;

namespace BusinessLayer.Entities.MovieInfos;

public class MovieCommentEntity
{
    public Guid CommentId { get; set; }

    public Guid MovieId { get; set; }

    public Guid UserId { get; set; }

    public Guid? OrderId { get; set; }

    public Guid? ParentCommentId { get; set; }

    public int? Rating { get; set; }

    [Column(TypeName = "nvarchar(1000)")]
    public string Content { get; set; } = string.Empty;

    public MovieCommentStatusEnum Status { get; set; } = MovieCommentStatusEnum.PendingModeration;

    [Column(TypeName = "nvarchar(500)")]
    public string? ModerationReason { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public MovieInfoEntity MovieInfoEntity { get; set; } = null!;

    public UserInfoEntity UserInfoEntity { get; set; } = null!;

    public OrderInfoEntity? OrderInfoEntity { get; set; }

    public MovieCommentEntity? ParentComment { get; set; }

    public List<MovieCommentEntity> Replies { get; set; } = [];
}

