using System;
using System.Threading.Tasks;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Banners;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Admin.Banners;

public class DeleteBannerUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IBannerRepository _repository;

    public DeleteBannerUseCase(IBannerRepository repository, IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
    }

    public async Task ExecuteAsync(Guid id)
    {
        var banner = await _repository.GetBannerByIdAsync(id);
        if (banner == null)
            throw new NotFoundException(Messages.Banner.NotFound);

        _repository.RemoveBanner(banner);
        await _unitOfWork.SaveChangesAsync();
    }
}
