using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Localization;
using Cinema.Domain.Utils;

namespace Cinema.Application.UseCases.Booking;

public class GetCinemaShowtimesUseCase
{
    private readonly IBookingShowtimeRepository _repository;

    public GetCinemaShowtimesUseCase(IBookingShowtimeRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<ResPublicCinemaShowtimeDto>>> ExecuteAsync(Guid movieId, string city, DateTime? date)
    {
        var nowUtc = DateTime.UtcNow;
        var targetDateVn = date ?? DateTime.UtcNow.Date;
        var startUtc = DateTimeHelper.NormalizeIncoming(targetDateVn.Date);
        var endUtc = startUtc.AddDays(1);

        var rawSchedules = await _repository.GetCinemaShowtimesAsync(movieId, city, startUtc, endUtc, nowUtc);

        var cinemas = rawSchedules
            .GroupBy(s => new {
                CinemaId = s.AuditoriumInfoEntities?.CinemaId ?? Guid.Empty,
                CinemaName = s.AuditoriumInfoEntities?.CinemaInfoEntity?.CinemaName ?? string.Empty,
                CinemaLocation = s.AuditoriumInfoEntities?.CinemaInfoEntity?.CinemaLocation ?? string.Empty,
                CinemaCity = s.AuditoriumInfoEntities?.CinemaInfoEntity?.CinemaCity ?? string.Empty
            })
            .Select(cGroup => new ResPublicCinemaShowtimeDto
            {
                CinemaId = cGroup.Key.CinemaId,
                CinemaName = cGroup.Key.CinemaName,
                CinemaLocation = cGroup.Key.CinemaLocation,
                CinemaCity = cGroup.Key.CinemaCity,
                FormatShowtimes = cGroup.GroupBy(f => new {
                    FormatId = f.MovieFormatId,
                    FormatName = f.MovieFormatInfoEntity?.MovieFormatName ?? string.Empty
                })
                .Select(fGroup => new FormatShowtimeGroup
                {
                    FormatId = fGroup.Key.FormatId,
                    FormatName = fGroup.Key.FormatName,
                    Showtimes = fGroup.Select(s => new ShowtimeSlot
                    {
                        ScheduleId = s.MovieScheduleInfoId,
                        StartTime = DateTimeHelper.ToVietnamTime(s.StartTime),
                        EndedTime = DateTimeHelper.ToVietnamTime(s.EndedTime),
                        AuditoriumId = s.AuditoriumId,
                        AuditoriumNumber = s.AuditoriumInfoEntities?.AuditoriumNumber ?? string.Empty
                    }).OrderBy(s => s.StartTime).ToList()
                }).ToList()
            })
            .Where(c => c.FormatShowtimes.Any())
            .ToList();

        return new BaseResponse<List<ResPublicCinemaShowtimeDto>>
        {
            IsSuccess = true,
            Data = cinemas,
            Message = Messages.Booking.GetShowtimesSuccess
        };
    }
}
