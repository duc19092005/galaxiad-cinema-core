using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;

namespace Cinema.Application.Interfaces.Catalog;

public interface IPublicCatalogRepository
{
    Task<List<BaseFormatInfo>> GetMovieFormatsAsync();
    Task<List<BaseRequiredAge>> GetMovieRequiredAgeAsync();
    Task<List<MovieInfoRes>> GetMoviesAsync(string? city, string? status, Guid? cinemaId);
    Task<MovieDetailInfoRes?> GetMovieDetailAsync(Guid movieId);
    Task<List<DateTime>> GetScheduleUtcTimesAsync(Guid movieId, string? city);
    Task<List<MovieScheduleInfoEntity>> GetScheduleDetailsRawAsync(Guid movieId, DateTime startUtc, DateTime endUtc, string? city);
    Task<List<MovieScheduleInfoEntity>> GetSchedulesByDateAsync(DateTime startUtc, DateTime endUtc, string? city);
    Task<GetAuditoriumInfosRes?> GetAuditoriumDetailsAsync(Guid scheduleId);
    Task<List<DateTime>> GetAllUpcomingUtcTimesAsync(string? city, Guid? cinemaId);
    Task<List<MovieInfoEntity>> GetMoviesByIdsAsync(List<Guid> ids);
}
