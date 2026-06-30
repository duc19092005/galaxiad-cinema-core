using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces;
using Cinema.Application.UseCases.Admin.PricingPromotions;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking;

public class GetPricingUseCase
{
    private readonly IBookingPricingRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly CalculatePricingPromotionUseCase _calculatePricingPromotionUseCase;

    public GetPricingUseCase(
        IBookingPricingRepository repository,
        IUserContextService userContextService,
        CalculatePricingPromotionUseCase calculatePricingPromotionUseCase)
    {
        _repository = repository;
        _userContextService = userContextService;
        _calculatePricingPromotionUseCase = calculatePricingPromotionUseCase;
    }

    public async Task<BaseResponse<ResPublicPricingDto>> ExecuteAsync(Guid scheduleId)
    {
        var schedule = await _repository.GetScheduleForPricingAsync(scheduleId);
        if (schedule == null)
        {
            throw new NotFoundException(Messages.Booking.ScheduleNotFound);
        }

        var basePrice = schedule.MovieFormatInfoEntity?.MovieFormatPrice ?? 0;
        var cinemaId = schedule.AuditoriumInfoEntities?.CinemaId;
        var formatId = schedule.MovieFormatId;

        bool hasHighRole = _userContextService.IsInRole("Admin") || 
                           _userContextService.IsInRole("MovieManager") || 
                           _userContextService.IsInRole("TheaterManager") || 
                           _userContextService.IsInRole("FacilitiesManager");

        var segments = await _repository.GetSegmentsAsync(hasHighRole);
        var surcharges = await _repository.GetCinemaSurchargesAsync(cinemaId ?? Guid.Empty, formatId);

        var segmentPrices = new List<SegmentPriceDto>();
        foreach (var seg in segments)
        {
            var surcharge = surcharges.FirstOrDefault(s => s.UserSegmentId == seg.UserSegmentId);
            var priceBeforePromotion = basePrice;
            if (surcharge != null)
            {
                priceBeforePromotion = basePrice * (1 + (surcharge.SurchangePercent / 100));
            }

            priceBeforePromotion = Math.Round(priceBeforePromotion, 0);
            var promotionPrice = await _calculatePricingPromotionUseCase.ExecuteAsync(schedule, priceBeforePromotion, seg.UserSegmentId);

            segmentPrices.Add(new SegmentPriceDto
            {
                UserSegmentId = seg.UserSegmentId,
                SegmentName = seg.UserSegmentName,
                Description = seg.UserSegmentDescription,
                BasePrice = basePrice,
                PriceBeforePromotion = priceBeforePromotion,
                PromotionAdjustmentAmount = promotionPrice.TotalAdjustmentAmount,
                FinalPrice = Math.Round(promotionPrice.FinalPrice, 0),
                AppliedPromotions = promotionPrice.AppliedPromotions.Select(MapAppliedPromotion).ToList()
            });
        }

        var pricing = new ResPublicPricingDto
        {
            ScheduleId = scheduleId,
            BasePrice = basePrice,
            SegmentPrices = segmentPrices
        };

        pricing.AppliedPromotions = pricing.SegmentPrices
            .SelectMany(x => x.AppliedPromotions)
            .GroupBy(x => x.RuleId)
            .Select(x => x.First())
            .ToList();

        return new BaseResponse<ResPublicPricingDto>
        {
            IsSuccess = true,
            Data = pricing,
            Message = Messages.Booking.GetPricingSuccess
        };
    }

    private static Cinema.Application.Dtos.Booking.AppliedPricingPromotionDto MapAppliedPromotion(
        Cinema.Application.Dtos.PricingPromotions.AppliedPricingPromotionDto source)
    {
        return new Cinema.Application.Dtos.Booking.AppliedPricingPromotionDto
        {
            PromotionId = source.PromotionId,
            RuleId = source.RuleId,
            Title = source.Title,
            PromotionTypeName = source.PromotionTypeName,
            AdjustmentValue = source.AdjustmentValue,
            AmountChanged = source.AmountChanged,
            PriceBefore = source.PriceBefore,
            PriceAfter = source.PriceAfter
        };
    }
}
