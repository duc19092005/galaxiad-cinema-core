using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Application.Interfaces.PricingPromotions;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.Admin.PricingPromotions;

public class GetPricingPromotionOptionsUseCase
{
    private readonly IPricingPromotionRepository _repository;

    public GetPricingPromotionOptionsUseCase(IPricingPromotionRepository repository)
    {
        _repository = repository;
    }

    public async Task<PricingPromotionOptionsDto> ExecuteAsync()
    {
        var formats = await _repository.GetMovieFormatsAsync();
        var cinemas = await _repository.GetCinemasAsync();
        var auditoriums = await _repository.GetAuditoriumsAsync();
        return new PricingPromotionOptionsDto
        {
            Formats = formats.Select(x => new PricingPromotionOptionDto { Id = x.MovieFormatId.ToString(), Name = x.MovieFormatName }).ToList(),
            Cinemas = cinemas.Select(x => new PricingPromotionOptionDto { Id = x.CinemaId.ToString(), Name = x.CinemaName }).ToList(),
            Auditoriums = auditoriums.Select(x => new PricingPromotionOptionDto { Id = x.AuditoriumId.ToString(), Name = x.AuditoriumNumber }).ToList(),
            MembershipTiers = System.Enum.GetValues<MembershipRankEnum>()
                .Select(x => new PricingPromotionOptionDto { Id = ((int)x).ToString(), Name = x.ToString() })
                .ToList()
        };
    }
}
