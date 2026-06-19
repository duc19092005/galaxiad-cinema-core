using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Application.Interfaces.Catalog;

namespace Cinema.Infrastructure.Repositories;

public class PublicCatalogRepository : IPublicCatalogRepository
{
    private readonly CinemaDbContext _dbContext;

    public PublicCatalogRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<BaseFormatInfo>> GetMovieFormatsAsync()
    {
        return await _dbContext.Set<MovieFormatInfoEntity>()
            .Select(x => new BaseFormatInfo
            {
                FormatId = x.MovieFormatId,
                FormatName = x.MovieFormatName
            })
            .ToListAsync();
    }

    public async Task<List<BaseRequiredAge>> GetMovieRequiredAgeAsync()
    {
        return await _dbContext.Set<movieRequiredAgeEntity>()
            .Select(x => new BaseRequiredAge
            {
                MovieRequiredAgeSymbolId = x.MovieRequiredAgeId,
                MovieRequiredAgeDescription = x.MovieRequiredAgeDescription,
                MovieRequiredAgeSymbol = x.MovieRequiredAgeSymbol.TrimEnd().TrimStart()
            })
            .ToListAsync();
    }

    public async Task<List<MovieInfoRes>> GetMoviesAsync(string? city, string? status, Guid? cinemaId)
    {
        var query = _dbContext.Set<MovieInfoEntity>()
            .Where(x => !x.IsDeleted);

        switch (status?.ToLower())
        {
            case "now-showing":
                query = query.Where(x => x.IsActive && !x.IsCommingSoon);
                break;
            case "coming-soon":
                query = query.Where(x => x.IsCommingSoon);
                break;
            default:
                query = query.Where(x => x.IsActive || x.IsCommingSoon);
                break;
        }

        if (!string.IsNullOrEmpty(city))
        {
            query = query.Where(x => x.MovieCinemaEntities
                .Any(mc => mc.CinemaInfoEntity.CinemaCity.Contains(city)));
        }

        if (cinemaId.HasValue)
        {
            query = query.Where(x => x.MovieCinemaEntities
                .Any(mc => mc.CinemaId == cinemaId.Value));
        }

        return await query.Select(x => new MovieInfoRes
        {
            MovieId = x.MovieId,
            MovieName = x.MovieName,
            MovieDuration = x.MovieDuration,
            MoviePosterURL = x.MovieImageUrl,
            MovieBannerURL = x.MovieBannerUrl,
            MovieRequiredAge = x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.TrimEnd().TrimStart(),
            MovieFormatInfos = string.Join(", ", x.MovieFormatMovieInfoEntity.Select(m => m.MovieFormatInfoEntity.MovieFormatName)),
            MovieCategoryInfos = string.Join(", ", x.MovieGenreMovieInfoEntity.Select(m => m.MovieGenreInfoEntity.MovieGenreName)),
            IsCommingSoon = x.IsCommingSoon,
            ExpectedReleaseDate = x.ActiveAt
        }).ToListAsync();
    }

    public async Task<MovieDetailInfoRes?> GetMovieDetailAsync(Guid movieId)
    {
        return await _dbContext.Set<MovieInfoEntity>()
            .Where(x => !x.IsDeleted && x.IsActive && x.MovieId == movieId)
            .Select(x => new MovieDetailInfoRes
            {
                MovieId = x.MovieId,
                MovieName = x.MovieName,
                MovieDuration = x.MovieDuration,
                MovieDescription = x.MovieDescription,
                MoviePosterURL = x.MovieImageUrl,
                MovieBannerURL = x.MovieBannerUrl,
                MovieRequiredAge = x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.TrimEnd().TrimStart(),
                MovieFormatInfos = string.Join(", ", x.MovieFormatMovieInfoEntity.Select(m => m.MovieFormatInfoEntity.MovieFormatName)),
                IsCommingSoon = x.IsCommingSoon,
                MovieCategoryInfos = string.Join(", ", x.MovieGenreMovieInfoEntity.Select(m => m.MovieGenreInfoEntity.MovieGenreName)),
                ReleaseDate = x.ActiveAt,
                Actor = x.Actors,
                Director = x.Director
            })
            .FirstOrDefaultAsync();
    }

    public async Task<List<DateTime>> GetScheduleUtcTimesAsync(Guid movieId, string? city)
    {
        var nowUtc = DateTime.UtcNow;
        var query = _dbContext.Set<MovieScheduleInfoEntity>()
            .Where(x => !x.IsDeleted && x.MovieId == movieId && x.StartTime > nowUtc);

        if (!string.IsNullOrEmpty(city))
        {
            query = query.Where(x => x.AuditoriumInfoEntities != null
                && x.AuditoriumInfoEntities.CinemaInfoEntity != null
                && x.AuditoriumInfoEntities.CinemaInfoEntity.CinemaCity.Contains(city));
        }

        return await query
            .Select(x => x.StartTime)
            .Distinct()
            .OrderBy(d => d)
            .ToListAsync();
    }

    public async Task<List<MovieScheduleInfoEntity>> GetScheduleDetailsRawAsync(Guid movieId, DateTime startUtc, DateTime endUtc, string? city)
    {
        var nowUtc = DateTime.UtcNow;
        var query = _dbContext.Set<MovieScheduleInfoEntity>()
            .Include(x => x.AuditoriumInfoEntities)
                .ThenInclude(a => a!.CinemaInfoEntity)
            .Include(x => x.MovieFormatInfoEntity)
            .Where(x => !x.IsDeleted
                     && x.MovieId == movieId
                     && x.StartTime >= startUtc
                     && x.StartTime < endUtc
                     && x.StartTime > nowUtc);

        if (!string.IsNullOrEmpty(city))
        {
            query = query.Where(x => x.AuditoriumInfoEntities != null
                                  && x.AuditoriumInfoEntities.CinemaInfoEntity != null
                                  && x.AuditoriumInfoEntities.CinemaInfoEntity.CinemaCity.Contains(city));
        }

        return await query.ToListAsync();
    }

    public async Task<GetAuditoriumInfosRes?> GetAuditoriumDetailsAsync(Guid scheduleId)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .Where(x => !x.IsDeleted && x.MovieScheduleInfoId == scheduleId)
            .Select(x => new GetAuditoriumInfosRes
            {
                MovieName = x.MovieInfoEntity != null ? x.MovieInfoEntity.MovieName : "",
                MovieVisualFormatName = x.MovieFormatInfoEntity != null ? x.MovieFormatInfoEntity.MovieFormatName : "",
                AuditoriumName = x.AuditoriumInfoEntities != null ? x.AuditoriumInfoEntities.AuditoriumNumber : "",
                AuditoriumId = x.AuditoriumId.ToString(),
                SeatMap = x.AuditoriumInfoEntities != null ? x.AuditoriumInfoEntities.SeatsInfoEntity.Select(s => new GetSeatsRes
                {
                    SeatId = s.SeatId,
                    SeatName = s.SeatNumber,
                    CoordX = s.CoordX,
                    CoordY = s.CoordY,
                    ColIndex = s.ColIndex,
                    RowIndex = s.RowIndex,
                    IsBooked = s.OrderDetailsInfo.Any(od => od.MovieScheduleId == scheduleId && od.SeatId == s.SeatId &&
                        (od.OrderInfoEntity.OrderStatus == Cinema.Domain.Enums.OrderStatusEnum.Booked || od.OrderInfoEntity.OrderStatus == Cinema.Domain.Enums.OrderStatusEnum.Pending))
                }).ToList() : new List<GetSeatsRes>()
            })
            .FirstOrDefaultAsync();
    }

    public async Task<List<DateTime>> GetAllUpcomingUtcTimesAsync(string? city, Guid? cinemaId)
    {
        var nowUtc = DateTime.UtcNow;
        var query = _dbContext.Set<MovieScheduleInfoEntity>()
            .Where(x => !x.IsDeleted && x.StartTime > nowUtc);

        if (!string.IsNullOrEmpty(city))
        {
            query = query.Where(x => x.AuditoriumInfoEntities != null
                && x.AuditoriumInfoEntities.CinemaInfoEntity != null
                && x.AuditoriumInfoEntities.CinemaInfoEntity.CinemaCity.Contains(city));
        }

        if (cinemaId.HasValue)
        {
            query = query.Where(x => x.AuditoriumInfoEntities!.CinemaId == cinemaId.Value);
        }

        return await query
            .Select(x => x.StartTime)
            .Distinct()
            .OrderBy(d => d)
            .ToListAsync();
    }
}
