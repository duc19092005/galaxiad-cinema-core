using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Domain.Entities.MovieInfos;

public class ShowtimeRecommendationActionEntity
{
    public Guid ActionId { get; set; }

    public Guid RecommendationId { get; set; }

    public Guid ActorUserId { get; set; }

    [Column(TypeName = "varchar(40)")]
    public string ActionType { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(1000)")]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ShowtimeRecommendationItemEntity Recommendation { get; set; } = null!;

    public UserInfoEntity ActorUser { get; set; } = null!;
}

