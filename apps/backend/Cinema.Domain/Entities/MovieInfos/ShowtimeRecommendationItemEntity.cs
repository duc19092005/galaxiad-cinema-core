using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;

namespace Cinema.Domain.Entities.MovieInfos;

public class ShowtimeRecommendationItemEntity
{
    public Guid RecommendationId { get; set; }

    public Guid BatchId { get; set; }

    public Guid CinemaId { get; set; }

    public Guid AuditoriumId { get; set; }

    public Guid MovieId { get; set; }

    public Guid FormatId { get; set; }

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    [Column(TypeName = "decimal(9,4)")]
    public decimal ConfidenceScore { get; set; }

    [Column(TypeName = "nvarchar(30)")]
    public string DemandLevel { get; set; } = "Medium";

    [Column(TypeName = "nvarchar(300)")]
    public string ExpectedImpact { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string ReasonsJson { get; set; } = "[]";

    [Column(TypeName = "nvarchar(max)")]
    public string ScoreSnapshotJson { get; set; } = "{}";

    public ShowtimeRecommendationStatusEnum Status { get; set; } = ShowtimeRecommendationStatusEnum.Suggested;

    public Guid? AppliedScheduleId { get; set; }

    public Guid? AppliedByUserId { get; set; }

    public DateTime? AppliedAt { get; set; }

    public Guid? DismissedByUserId { get; set; }

    public DateTime? DismissedAt { get; set; }

    [Column(TypeName = "nvarchar(500)")]
    public string? LastValidationMessage { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ShowtimeRecommendationBatchEntity Batch { get; set; } = null!;

    public CinemaInfoEntity CinemaInfoEntity { get; set; } = null!;

    public AuditoriumInfoEntities AuditoriumInfoEntity { get; set; } = null!;

    public MovieInfoEntity MovieInfoEntity { get; set; } = null!;

    public MovieFormatInfoEntity MovieFormatInfoEntity { get; set; } = null!;

    public MovieScheduleInfoEntity? AppliedSchedule { get; set; }

    public UserInfoEntity? AppliedByUser { get; set; }

    public UserInfoEntity? DismissedByUser { get; set; }

    public List<ShowtimeRecommendationActionEntity> Actions { get; set; } = [];
}

