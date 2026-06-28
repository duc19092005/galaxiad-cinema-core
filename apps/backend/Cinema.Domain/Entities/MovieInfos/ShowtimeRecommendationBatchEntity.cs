using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Domain.Entities.MovieInfos;

public class ShowtimeRecommendationBatchEntity
{
    public Guid BatchId { get; set; }

    public Guid CinemaId { get; set; }

    public Guid RequestedByUserId { get; set; }

    public DateTime FromDate { get; set; }

    public DateTime ToDate { get; set; }

    public Guid? AuditoriumId { get; set; }

    public int MaxSuggestions { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? RequestSnapshotJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public CinemaInfoEntity CinemaInfoEntity { get; set; } = null!;

    public UserInfoEntity RequestedByUser { get; set; } = null!;

    public AuditoriumInfoEntities? AuditoriumInfoEntity { get; set; }

    public List<ShowtimeRecommendationItemEntity> Items { get; set; } = [];
}

