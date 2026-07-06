using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Banners;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Banners;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Admin.Banners;

public class GetBannerByIdUseCase
{
    private readonly IBannerRepository _repository;

    public GetBannerByIdUseCase(IBannerRepository repository)
    {
        _repository = repository;
    }

    public async Task<BannerDto> ExecuteAsync(Guid id)
    {
        var banner = await _repository.GetBannerByIdAsync(id);
        if (banner == null)
            throw new NotFoundException(Messages.Banner.NotFound);

        return GetAllBannersUseCase.MapToDto(banner);
    }
}
