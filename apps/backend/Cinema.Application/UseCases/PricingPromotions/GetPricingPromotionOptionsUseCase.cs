using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.PricingPromotions;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.PricingPromotions;

public class GetPricingPromotionOptionsUseCase
{
    private readonly IUnitOfWork _unitOfWork;

    public GetPricingPromotionOptionsUseCase(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PricingPromotionOptionsDto> ExecuteAsync()
    {
        var formats = await _unitOfWork.Repository<MovieFormatInfoEntity>().Query()
            .OrderBy(x => x.MovieFormatName)
            .Select(x => new PricingPromotionOptionDto { Id = x.MovieFormatId, Name = x.MovieFormatName })
            .ToListAsync();

        var cinemas = await _unitOfWork.Repository<CinemaInfoEntity>().Query()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.CinemaName)
            .Select(x => new PricingPromotionOptionDto { Id = x.CinemaId, Name = x.CinemaName })
            .ToListAsync();

        var auditoriums = await _unitOfWork.Repository<AuditoriumInfoEntities>().Query()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.AuditoriumNumber)
            .Select(x => new PricingPromotionOptionDto { Id = x.AuditoriumId, Name = x.AuditoriumNumber })
            .ToListAsync();

        var membershipTiers = await _unitOfWork.Repository<UserSegmentsInfoEntity>().Query()
            .OrderBy(x => x.UserSegmentName)
            .Select(x => new PricingPromotionOptionDto { Id = x.UserSegmentId, Name = x.UserSegmentName })
            .ToListAsync();

        return new PricingPromotionOptionsDto
        {
            Formats = formats,
            Cinemas = cinemas,
            Auditoriums = auditoriums,
            MembershipTiers = membershipTiers
        };
    }
}
