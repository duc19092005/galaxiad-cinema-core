using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Enums;

namespace Cinema.Domain.Entities.Banners;

public class BannerEntity
{
    [Key]
    public Guid BannerId { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Subtitle { get; set; }

    [StringLength(2048)]
    public string? ImageUrl { get; set; }

    [StringLength(2048)]
    public string? LinkUrl { get; set; }

    public BannerContentType ContentType { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? ContentConfig { get; set; }

    public int DisplayOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public Guid? CinemaId { get; set; }

    [StringLength(100)]
    public string? CinemaCity { get; set; }

    public DateTime? StartDisplayAt { get; set; }

    public DateTime? EndDisplayAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public Guid? CreatedBy { get; set; }

    public Guid? UpdatedBy { get; set; }
}
