using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Utils;

using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking.Showtimes;

public class GetAdvancedSearchSchedulesUseCase
{
    private readonly IBookingShowtimeRepository _repository;

    public GetAdvancedSearchSchedulesUseCase(IBookingShowtimeRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<ResAdvancedSearchMovieDto>>> ExecuteAsync(DateTime? date, Guid? movieId, Guid? cinemaId)
    {
        var nowUtc = DateTime.UtcNow;
        var targetDateVn = date ?? DateTime.UtcNow.Date;
        var startUtc = DateTimeHelper.NormalizeIncoming(targetDateVn.Date);
        var endUtc = startUtc.AddDays(1);

        var schedules = await _repository.GetAdvancedSearchSchedulesAsync(startUtc, endUtc, nowUtc, movieId, cinemaId);

        var result = schedules.GroupBy(s => new { s.MovieId, s.MovieName, s.MovieImageUrl, s.MovieDuration, s.MovieRequiredAgeSymbol, s.MovieDescription })
            .Select(mGroup => new ResAdvancedSearchMovieDto
            {
                MovieId = mGroup.Key.MovieId,
                MovieName = mGroup.Key.MovieName,
                MovieImageUrl = mGroup.Key.MovieImageUrl,
                MovieDuration = mGroup.Key.MovieDuration,
                MovieRequiredAgeSymbol = mGroup.Key.MovieRequiredAgeSymbol,
                MovieDescription = mGroup.Key.MovieDescription,
                MovieGenres = mGroup.First().MovieGenres,
                Cinemas = mGroup.GroupBy(c => new { c.CinemaId, c.CinemaName, c.CinemaLocation, c.CinemaCity })
                    .Select(cGroup => new ResPublicCinemaShowtimeDto
                    {
                        CinemaId = cGroup.Key.CinemaId,
                        CinemaName = cGroup.Key.CinemaName,
                        CinemaLocation = cGroup.Key.CinemaLocation,
                        CinemaCity = cGroup.Key.CinemaCity,
                        FormatShowtimes = cGroup.GroupBy(f => new { f.FormatId, f.FormatName })
                            .Select(fGroup => new FormatShowtimeGroup
                            {
                                FormatId = fGroup.Key.FormatId,
                                FormatName = fGroup.Key.FormatName,
                                Showtimes = fGroup.Select(st => new ShowtimeSlot
                                {
                                    ScheduleId = st.ScheduleId,
                                    StartTime = DateTimeHelper.ToVietnamTime(st.StartTime),
                                    EndedTime = DateTimeHelper.ToVietnamTime(st.EndedTime),
                                    AuditoriumId = st.AuditoriumId,
                                    AuditoriumNumber = st.AuditoriumNumber
                                }).OrderBy(st => st.StartTime).ToList()
                            }).ToList()
                    }).ToList()
            }).ToList();

        return new BaseResponse<List<ResAdvancedSearchMovieDto>>
        {
            IsSuccess = true,
            Data = result,
            Message = Messages.Catalog.FilterSchedulesSuccess
        };
    }
}

