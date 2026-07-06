using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Banners;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Banners;
using Cinema.Domain.Entities.Banners;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Admin.Banners;

public class CreateBannerUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IBannerRepository _repository;
    private readonly IUserContextService _userContextService;

    public CreateBannerUseCase(
        IBannerRepository repository,
        IUserContextService userContextService,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _userContextService = userContextService;
    }

    public async Task<BannerDto> ExecuteAsync(BannerUpsertDto dto)
    {
        var userId = TryGetUserId();
        var maxOrder = await _repository.GetMaxDisplayOrderAsync();

        var banner = new BannerEntity
        {
            BannerId = Guid.NewGuid(),
            Title = dto.Title.Trim(),
            Subtitle = (dto.Subtitle ?? string.Empty).Trim(),
            ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl.Trim(),
            LinkUrl = string.IsNullOrWhiteSpace(dto.LinkUrl) ? null : dto.LinkUrl.Trim(),
            ContentType = dto.ContentType,
            ContentConfig = dto.ContentConfig,
            DisplayOrder = dto.DisplayOrder > 0 ? dto.DisplayOrder : maxOrder + 1,
            IsActive = dto.IsActive,
            CinemaId = dto.CinemaId,
            CinemaCity = string.IsNullOrWhiteSpace(dto.CinemaCity) ? null : dto.CinemaCity.Trim(),
            StartDisplayAt = dto.StartDisplayAt,
            EndDisplayAt = dto.EndDisplayAt,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            UpdatedBy = userId,
        };

        await _repository.AddBannerAsync(banner);
        await _unitOfWork.SaveChangesAsync();
        return GetAllBannersUseCase.MapToDto(banner);
    }

    private Guid? TryGetUserId()
    {
        try { return _userContextService.GetUserId(); }
        catch { return null; }
    }
}
