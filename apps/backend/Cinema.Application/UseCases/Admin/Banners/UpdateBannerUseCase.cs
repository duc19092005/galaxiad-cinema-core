using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Banners;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Banners;
using Cinema.Domain.Entities.Banners;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Admin.Banners;

public class UpdateBannerUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IBannerRepository _repository;
    private readonly IUserContextService _userContextService;

    public UpdateBannerUseCase(
        IBannerRepository repository,
        IUserContextService userContextService,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _userContextService = userContextService;
    }

    public async Task<BannerDto> ExecuteAsync(Guid id, BannerUpsertDto dto)
    {
        var banner = await _repository.GetBannerByIdAsync(id);
        if (banner == null)
            throw new NotFoundException(Messages.Banner.NotFound);

        banner.Title = dto.Title.Trim();
        banner.Subtitle = (dto.Subtitle ?? string.Empty).Trim();
        banner.ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl.Trim();
        banner.LinkUrl = string.IsNullOrWhiteSpace(dto.LinkUrl) ? null : dto.LinkUrl.Trim();
        banner.ContentType = dto.ContentType;
        banner.ContentConfig = dto.ContentConfig;
        banner.DisplayOrder = dto.DisplayOrder;
        banner.IsActive = dto.IsActive;
        banner.CinemaId = dto.CinemaId;
        banner.CinemaCity = string.IsNullOrWhiteSpace(dto.CinemaCity) ? null : dto.CinemaCity.Trim();
        banner.StartDisplayAt = dto.StartDisplayAt;
        banner.EndDisplayAt = dto.EndDisplayAt;
        banner.UpdatedAt = DateTime.UtcNow;
        banner.UpdatedBy = TryGetUserId();

        _repository.UpdateBanner(banner);
        await _unitOfWork.SaveChangesAsync();

        return GetAllBannersUseCase.MapToDto(banner);
    }

    private Guid? TryGetUserId()
    {
        try { return _userContextService.GetUserId(); }
        catch { return null; }
    }
}
