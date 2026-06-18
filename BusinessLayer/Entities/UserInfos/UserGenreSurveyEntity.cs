// ReSharper disable All
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BusinessLayer.Entities.UserInfos;

public class UserGenreSurveyEntity
{
    [Key]
    public Guid SurveyId { get; set; }

    public Guid UserId { get; set; }

    // Stored as JSON string: ["GenreId1", "GenreId2", ...]
    [Column(TypeName = "nvarchar(2000)")]
    public string PreferredGenreIds { get; set; } = "[]";

    // Free text describing preferences: "Tôi thích phim hành động, khoa học viễn tưởng"
    [Column(TypeName = "nvarchar(1000)")]
    public string PreferenceDescription { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public UserInfoEntity UserInfoEntity { get; set; } = null!;
}
