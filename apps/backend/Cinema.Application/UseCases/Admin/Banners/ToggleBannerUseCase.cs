using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Banners;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Banners;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Admin.Banners;

public class ToggleBannerUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IBannerRepository _repository;

    public ToggleBannerUseCase(IBannerRepository repository, IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
    }

    public async Task<BannerDto> ExecuteAsync(Guid id)
    {
        var banner = await _repository.GetBannerByIdAsync(id);
        if (banner == null)
            throw new NotFoundException(Messages.Banner.NotFound);

        banner.IsActive = !banner.IsActive;
        banner.UpdatedAt = DateTime.UtcNow;

        _repository.UpdateBanner(banner);
        await _unitOfWork.SaveChangesAsync();

        return GetAllBannersUseCase.MapToDto(banner);
    }
}
