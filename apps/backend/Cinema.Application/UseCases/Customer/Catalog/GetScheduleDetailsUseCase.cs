using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Application.Interfaces.Catalog;
using Cinema.Domain.Localization;
using Cinema.Domain.Utils;

namespace Cinema.Application.UseCases.Customer.Catalog;

public class GetScheduleDetailsUseCase
{
    private readonly IPublicCatalogRepository _repository;

    public GetScheduleDetailsUseCase(IPublicCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<GetScheduleDetailsRes>>> ExecuteAsync(Guid movieId, DateTime scheduleDate, string? city)
    {
        var startOfDayVn = scheduleDate.Date;
        var startUtc = DateTimeHelper.ToUtc(startOfDayVn);
        var endUtc = startUtc.AddDays(1);

        var flatSchedules = await _repository.GetScheduleDetailsRawAsync(movieId, startUtc, endUtc, city);

        var getScheduleDetails = flatSchedules
            .GroupBy(x => new
            {
                CinemaName = x.AuditoriumInfoEntities?.CinemaInfoEntity?.CinemaName ?? "",
                CinemaLocation = x.AuditoriumInfoEntities?.CinemaInfoEntity?.CinemaLocation ?? "",
                MovieFormatName = x.MovieFormatInfoEntity?.MovieFormatName ?? ""
            })
            .Select(g => new GetScheduleDetailsRes
            {
                CinemaName = g.Key.CinemaName,
                CinemaAddress = g.Key.CinemaLocation,
                MovieFormatName = g.Key.MovieFormatName,
                ScheduleTimesInfos = g.Select(s => new GetScheduleTimeRes
                {
                    ScheduleId = s.MovieScheduleInfoId,
                    ShowTime = DateTimeHelper.ToVietnamTime(s.StartTime)
                })
                .OrderBy(t => t.ShowTime)
                .ToList()
            })
            .ToList();

        return new BaseResponse<List<GetScheduleDetailsRes>>
        {
            Data = getScheduleDetails,
            IsSuccess = true,
            Message = Messages.Catalog.GetScheduleDetailsSuccess
        };
    }
}

