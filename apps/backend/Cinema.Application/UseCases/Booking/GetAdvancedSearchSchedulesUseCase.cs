using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Utils;

namespace Cinema.Application.UseCases.Booking;

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

        var projected = schedules.Select(s => new
        {
            s.MovieScheduleInfoId,
            s.StartTime,
            s.EndedTime,
            s.MovieId,
            MovieName = s.MovieInfoEntity?.MovieName ?? string.Empty,
            MovieImageUrl = s.MovieInfoEntity?.MovieImageUrl ?? string.Empty,
            MovieDuration = s.MovieInfoEntity?.MovieDuration ?? 0,
            MovieDescription = s.MovieInfoEntity?.MovieDescription ?? string.Empty,
            MovieRequiredAgeSymbol = s.MovieInfoEntity?.MovieRequiredAgeEntity?.MovieRequiredAgeSymbol?.Trim() ?? string.Empty,
            MovieGenres = s.MovieInfoEntity?.MovieGenreMovieInfoEntity?.Select(g => g.MovieGenreInfoEntity.MovieGenreName).ToList() ?? [],
            CinemaId = s.AuditoriumInfoEntities?.CinemaId ?? Guid.Empty,
            CinemaName = s.AuditoriumInfoEntities?.CinemaInfoEntity?.CinemaName ?? string.Empty,
            CinemaLocation = s.AuditoriumInfoEntities?.CinemaInfoEntity?.CinemaLocation ?? string.Empty,
            CinemaCity = s.AuditoriumInfoEntities?.CinemaInfoEntity?.CinemaCity ?? string.Empty,
            FormatId = s.MovieFormatId,
            FormatName = s.MovieFormatInfoEntity?.MovieFormatName ?? string.Empty,
            AuditoriumId = s.AuditoriumId,
            AuditoriumNumber = s.AuditoriumInfoEntities?.AuditoriumNumber ?? string.Empty
        }).ToList();

        var result = projected.GroupBy(s => new { s.MovieId, s.MovieName, s.MovieImageUrl, s.MovieDuration, s.MovieRequiredAgeSymbol, s.MovieDescription })
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
                                    ScheduleId = st.MovieScheduleInfoId,
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
            Message = "Lá»c danh sÃ¡ch phim vÃ  lá»‹ch chiáº¿u thÃ nh cÃ´ng"
        };
    }
}

