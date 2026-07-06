using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Banners;
using Cinema.Application.Interfaces.Banners;

namespace Cinema.Application.UseCases.Admin.Banners;

public class GetBannerScopeUseCase
{
    private readonly IBannerRepository _repository;

    public GetBannerScopeUseCase(IBannerRepository repository)
    {
        _repository = repository;
    }

    public async Task<BannerScopeDto> ExecuteAsync()
    {
        var cities = await _repository.GetDistinctCitiesAsync();
        return new BannerScopeDto
        {
            Cities = cities,
            Cinemas = [] // Cinema list loaded separately by options endpoint
        };
    }
}
