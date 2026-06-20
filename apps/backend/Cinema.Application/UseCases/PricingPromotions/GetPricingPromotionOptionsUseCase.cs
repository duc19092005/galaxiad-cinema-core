using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Application.Interfaces.PricingPromotions;

namespace Cinema.Application.UseCases.PricingPromotions;

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
        var membershipTiers = await _repository.GetMembershipTiersAsync();

        return new PricingPromotionOptionsDto
        {
            Formats = formats.Select(x => new PricingPromotionOptionDto { Id = x.MovieFormatId, Name = x.MovieFormatName }).ToList(),
            Cinemas = cinemas.Select(x => new PricingPromotionOptionDto { Id = x.CinemaId, Name = x.CinemaName }).ToList(),
            Auditoriums = auditoriums.Select(x => new PricingPromotionOptionDto { Id = x.AuditoriumId, Name = x.AuditoriumNumber }).ToList(),
            MembershipTiers = membershipTiers.Select(x => new PricingPromotionOptionDto { Id = x.UserSegmentId, Name = x.UserSegmentName }).ToList()
        };
    }
}
