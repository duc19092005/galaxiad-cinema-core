using System.ComponentModel.DataAnnotations;
using Cinema.Domain.Enums;

namespace Cinema.Application.Dtos.Banners;

public class BannerUpsertDto
{
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;
    [StringLength(500)]
    public string? Subtitle { get; set; }
    [StringLength(2048)]
    public string? ImageUrl { get; set; }
    [StringLength(2048)]
    public string? LinkUrl { get; set; }
    [Required]
    public BannerContentType ContentType { get; set; }
    public string? ContentConfig { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public Guid? CinemaId { get; set; }
    [StringLength(100)]
    public string? CinemaCity { get; set; }
    public DateTime? StartDisplayAt { get; set; }
    public DateTime? EndDisplayAt { get; set; }
}

public class BannerDto
{
    public Guid BannerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string? ImageUrl { get; set; }
    public string? LinkUrl { get; set; }
    public BannerContentType ContentType { get; set; }
    public string ContentTypeDisplay { get; set; } = string.Empty;
    public string? ContentConfig { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public Guid? CinemaId { get; set; }
    public string? CinemaName { get; set; }
    public string? CinemaCity { get; set; }
    public string? ScopeDisplay { get; set; }
    public DateTime? StartDisplayAt { get; set; }
    public DateTime? EndDisplayAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Public banner DTO with resolved content items for frontend display
/// </summary>
public class PublicBannerDto
{
    public Guid BannerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string? ImageUrl { get; set; }
    public string? LinkUrl { get; set; }
    public BannerContentType ContentType { get; set; }
    public string ContentTypeDisplay { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public List<BannerContentItemDto> Items { get; set; } = [];
}

public class BannerContentItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public string? Extra { get; set; } // e.g. "45k views", "15% off"
}

public class BannerScopeDto
{
    public List<BannerCinemaOptionDto> Cinemas { get; set; } = [];
    public List<string> Cities { get; set; } = [];
}

public class BannerCinemaOptionDto
{
    public Guid CinemaId { get; set; }
    public string CinemaName { get; set; } = string.Empty;
    public string CinemaCity { get; set; } = string.Empty;
}
