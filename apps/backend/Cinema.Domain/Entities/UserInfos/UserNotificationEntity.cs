using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.MovieInfos;

namespace Cinema.Domain.Entities.UserInfos;

public class UserNotificationEntity
{
    public Guid NotificationId { get; set; }

    public Guid UserId { get; set; }

    [Column(TypeName = "nvarchar(120)")]
    public string Title { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(500)")]
    public string Message { get; set; } = string.Empty;

    [Column(TypeName = "varchar(60)")]
    public string Type { get; set; } = string.Empty;

    public Guid? RelatedCommentId { get; set; }

    public Guid? RelatedMovieId { get; set; }

    public bool IsRead { get; set; }

    public DateTime CreatedAt { get; set; }

    public UserInfoEntity UserInfoEntity { get; set; } = null!;

    public MovieCommentEntity? RelatedComment { get; set; }

    public MovieInfoEntity? RelatedMovie { get; set; }
}

