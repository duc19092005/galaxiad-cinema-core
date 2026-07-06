using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Banners;
using Cinema.Application.Interfaces.Banners;

namespace Cinema.Application.UseCases.Admin.Banners;

public class GetAllBannersUseCase
{
    private readonly IBannerRepository _repository;

    public GetAllBannersUseCase(IBannerRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<BannerDto>> ExecuteAsync()
    {
        var banners = await _repository.GetAllBannersAsync();
        return banners.Select(MapToDto).ToList();
    }

    public static BannerDto MapToDto(Domain.Entities.Banners.BannerEntity b)
    {
        return new BannerDto
        {
            BannerId = b.BannerId,
            Title = b.Title,
            Subtitle = b.Subtitle,
            ImageUrl = b.ImageUrl,
            LinkUrl = b.LinkUrl,
            ContentType = b.ContentType,
            ContentTypeDisplay = b.ContentType.ToString(),
            ContentConfig = b.ContentConfig,
            DisplayOrder = b.DisplayOrder,
            IsActive = b.IsActive,
            CinemaId = b.CinemaId,
            CinemaCity = b.CinemaCity,
            ScopeDisplay = b.CinemaId.HasValue ? "Specific Cinema"
                           : !string.IsNullOrEmpty(b.CinemaCity) ? b.CinemaCity
                           : "System-wide",
            StartDisplayAt = b.StartDisplayAt,
            EndDisplayAt = b.EndDisplayAt,
            CreatedAt = b.CreatedAt,
            UpdatedAt = b.UpdatedAt,
        };
    }
}
