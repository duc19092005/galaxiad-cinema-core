using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Application.Interfaces.Catalog;
using Cinema.Domain.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Persistence.Repositories.Catalog;

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
                MovieRequiredAgeSymbol = x.MovieRequiredAgeSymbol.Trim()
            })
            .ToListAsync();
    }

    public async Task<List<MovieInfoRes>> GetMoviesAsync(string? city, string? status, Guid? cinemaId)
    {
        var now = DateTime.UtcNow;
        var query = _dbContext.Set<MovieInfoEntity>()
            .Where(x => !x.IsDeleted && now <= x.EndedDate);

        switch (status?.ToLower())
        {
            case "now-showing":
                query = query.Where(x => x.IsActive && !x.IsCommingSoon && x.ActiveAt <= now);
                break;
            case "coming-soon":
                query = query.Where(x => x.IsCommingSoon || now < x.ActiveAt);
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

        var rawMovies = await query.AsNoTracking().Select(x => new
        {
            MovieId = x.MovieId,
            MovieName = x.MovieName,
            MovieDuration = x.MovieDuration,
            MoviePosterURL = x.MovieImageUrl,
            MovieBannerURL = x.MovieBannerUrl,
            MovieRequiredAge = x.MovieRequiredAgeEntity != null ? x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol : string.Empty,
            MovieFormats = x.MovieFormatMovieInfoEntity.Select(m => m.MovieFormatInfoEntity.MovieFormatName).ToList(),
            MovieCategories = x.MovieGenreMovieInfoEntity.Select(m => m.MovieGenreInfoEntity.MovieGenreName).ToList(),
            IsCommingSoon = x.IsCommingSoon,
            ExpectedReleaseDate = x.ActiveAt
        }).ToListAsync();

        return rawMovies.Select(x => new MovieInfoRes
        {
            MovieId = x.MovieId,
            MovieName = x.MovieName,
            MovieDuration = x.MovieDuration,
            MoviePosterURL = x.MoviePosterURL,
            MovieBannerURL = x.MovieBannerURL,
            MovieRequiredAge = (x.MovieRequiredAge ?? string.Empty).Trim(),
            MovieFormatInfos = string.Join(", ", x.MovieFormats),
            MovieCategoryInfos = string.Join(", ", x.MovieCategories),
            IsCommingSoon = x.IsCommingSoon,
            ExpectedReleaseDate = x.ExpectedReleaseDate
        }).ToList();
    }

    public async Task<MovieDetailInfoRes?> GetMovieDetailAsync(Guid movieId)
    {
        var rawMovie = await _dbContext.Set<MovieInfoEntity>()
            .Where(x => !x.IsDeleted && x.IsActive && x.MovieId == movieId)
            .AsNoTracking()
            .Select(x => new
            {
                MovieId = x.MovieId,
                MovieName = x.MovieName,
                MovieDuration = x.MovieDuration,
                MovieDescription = x.MovieDescription,
                MoviePosterURL = x.MovieImageUrl,
                MovieBannerURL = x.MovieBannerUrl,
                TrailerUrl = x.TrailerUrl,
                MovieRequiredAge = x.MovieRequiredAgeEntity != null ? x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol : string.Empty,
                MovieFormats = x.MovieFormatMovieInfoEntity.Select(m => m.MovieFormatInfoEntity.MovieFormatName).ToList(),
                IsCommingSoon = x.IsCommingSoon,
                MovieCategories = x.MovieGenreMovieInfoEntity.Select(m => m.MovieGenreInfoEntity.MovieGenreName).ToList(),
                ReleaseDate = x.ActiveAt,
                Actor = x.Actors,
                Director = x.Director,
                CoverImages = x.MovieCoverImageEntities
                    .Where(c => c.IsActive)
                    .OrderBy(c => c.SortOrder)
                    .Select(c => new MovieCoverImageRes
                    {
                        MovieCoverImageId = c.MovieCoverImageId,
                        ImageUrl = c.ImageUrl,
                        SortOrder = c.SortOrder,
                        IsPrimary = c.IsPrimary,
                        Caption = c.Caption
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        if (rawMovie == null) return null;

        var coverImages = rawMovie.CoverImages;
        var primaryBanner = coverImages.FirstOrDefault(c => c.IsPrimary)?.ImageUrl
            ?? coverImages.FirstOrDefault()?.ImageUrl
            ?? rawMovie.MovieBannerURL;

        return new MovieDetailInfoRes
        {
            MovieId = rawMovie.MovieId,
            MovieName = rawMovie.MovieName,
            MovieDuration = rawMovie.MovieDuration,
            MovieDescription = rawMovie.MovieDescription,
            MoviePosterURL = rawMovie.MoviePosterURL,
            MovieBannerURL = primaryBanner,
            TrailerUrl = rawMovie.TrailerUrl,
            MovieRequiredAge = (rawMovie.MovieRequiredAge ?? string.Empty).Trim(),
            MovieFormatInfos = string.Join(", ", rawMovie.MovieFormats),
            IsCommingSoon = rawMovie.IsCommingSoon,
            MovieCategoryInfos = string.Join(", ", rawMovie.MovieCategories),
            ReleaseDate = rawMovie.ReleaseDate,
            Actor = rawMovie.Actor,
            Director = rawMovie.Director,
            CoverImages = coverImages
        };
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

    public async Task<List<MovieScheduleInfoEntity>> GetSchedulesByDateAsync(DateTime startUtc, DateTime endUtc, string? city)
    {
        var nowUtc = DateTime.UtcNow;
        var query = _dbContext.Set<MovieScheduleInfoEntity>()
            .Include(x => x.MovieInfoEntity)
            .Include(x => x.AuditoriumInfoEntities)
                .ThenInclude(a => a!.CinemaInfoEntity)
            .Include(x => x.MovieFormatInfoEntity)
            .Where(x => !x.IsDeleted
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
                MovieRequiredAgeSymbol = x.MovieInfoEntity != null && x.MovieInfoEntity.MovieRequiredAgeEntity != null
                    ? (x.MovieInfoEntity.MovieRequiredAgeEntity.MovieRequiredAgeSymbol ?? string.Empty).Trim()
                    : string.Empty,
                AuditoriumName = x.AuditoriumInfoEntities != null ? x.AuditoriumInfoEntities.AuditoriumNumber : "",
                AuditoriumId = x.AuditoriumId.ToString(),
                StartTime = x.StartTime,
                CenterRowStart = x.AuditoriumInfoEntities != null ? x.AuditoriumInfoEntities.CenterRowStart : 0,
                CenterRowEnd = x.AuditoriumInfoEntities != null ? x.AuditoriumInfoEntities.CenterRowEnd : 0,
                CenterColStart = x.AuditoriumInfoEntities != null ? x.AuditoriumInfoEntities.CenterColStart : 0,
                CenterColEnd = x.AuditoriumInfoEntities != null ? x.AuditoriumInfoEntities.CenterColEnd : 0,
                SeatMap = x.AuditoriumInfoEntities != null ? x.AuditoriumInfoEntities.SeatsInfoEntity.Select(s => new GetSeatsRes
                {
                    SeatId = s.SeatId,
                    SeatName = s.SeatNumber,
                    CoordX = s.CoordX,
                    CoordY = s.CoordY,
                    ColIndex = s.ColIndex,
                    RowIndex = s.RowIndex,
                    IsBooked = s.OrderDetailsInfo.Any(od => od.MovieScheduleId == scheduleId && od.SeatId == s.SeatId && od.ReleasedAt == null &&
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

    public async Task<List<MovieInfoEntity>> GetMoviesByIdsAsync(List<Guid> ids)
    {
        return await _dbContext.Set<MovieInfoEntity>()
            .Include(m => m.MovieGenreMovieInfoEntity)
                .ThenInclude(g => g.MovieGenreInfoEntity)
            .Where(m => !m.IsDeleted && ids.Contains(m.MovieId))
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<(List<string> Directors, List<string> Actors)> GetMoviePeopleAsync()
    {
        var rows = await _dbContext.Set<MovieInfoEntity>()
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .Select(x => new { x.Director, x.Actors })
            .ToListAsync();

        static IEnumerable<string> SplitPeople(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) yield break;
            foreach (var part in raw.Split(new[] { ',', ';', '|' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (!string.IsNullOrWhiteSpace(part))
                    yield return part.Trim();
            }
        }

        var directors = rows
            .SelectMany(r => SplitPeople(r.Director))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(x => x)
            .ToList();

        var actors = rows
            .SelectMany(r => SplitPeople(r.Actors))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(x => x)
            .ToList();

        return (directors, actors);
    }

    public async Task<(List<MovieInfoRes> Items, int TotalCount)> GetMoviesByPersonAsync(
        string personName,
        string role,
        int pageIndex,
        int pageSize)
    {
        var name = (personName ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(name))
            return ([], 0);

        pageIndex = pageIndex < 1 ? 1 : pageIndex;
        pageSize = pageSize is < 1 or > 48 ? 12 : pageSize;

        var roleNorm = (role ?? "actor").Trim().ToLowerInvariant();
        var isDirector = roleNorm is "director" or "directing" or "dao-dien" or "đạo-diễn";

        // Broad SQL filter (Contains), then exact token match in memory so "Lee" != "Lee Byung-hun"
        var candidates = await _dbContext.Set<MovieInfoEntity>()
            .AsNoTracking()
            .Where(x => !x.IsDeleted && (x.IsActive || x.IsCommingSoon))
            .Where(x => isDirector
                ? (x.Director != null && x.Director.Contains(name))
                : (x.Actors != null && x.Actors.Contains(name)))
            .Select(x => new
            {
                x.MovieId,
                x.MovieName,
                x.MovieDuration,
                MoviePosterURL = x.MovieImageUrl,
                MovieBannerURL = x.MovieBannerUrl,
                MovieRequiredAge = x.MovieRequiredAgeEntity != null
                    ? x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol
                    : string.Empty,
                MovieFormats = x.MovieFormatMovieInfoEntity.Select(m => m.MovieFormatInfoEntity.MovieFormatName).ToList(),
                MovieCategories = x.MovieGenreMovieInfoEntity.Select(m => m.MovieGenreInfoEntity.MovieGenreName).ToList(),
                x.IsCommingSoon,
                ExpectedReleaseDate = x.ActiveAt,
                x.Director,
                x.Actors,
                x.ActiveAt
            })
            .ToListAsync();

        static bool HasExactPerson(string? raw, string person)
        {
            if (string.IsNullOrWhiteSpace(raw)) return false;
            return raw
                .Split(new[] { ',', ';', '|' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Any(p => string.Equals(p, person, StringComparison.OrdinalIgnoreCase));
        }

        var matched = candidates
            .Where(x => isDirector ? HasExactPerson(x.Director, name) : HasExactPerson(x.Actors, name))
            .OrderByDescending(x => x.ActiveAt)
            .ThenBy(x => x.MovieName)
            .ToList();

        var total = matched.Count;
        var page = matched
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new MovieInfoRes
            {
                MovieId = x.MovieId,
                MovieName = x.MovieName,
                MovieDuration = x.MovieDuration,
                MoviePosterURL = x.MoviePosterURL,
                MovieBannerURL = x.MovieBannerURL,
                MovieRequiredAge = (x.MovieRequiredAge ?? string.Empty).Trim(),
                MovieFormatInfos = string.Join(", ", x.MovieFormats),
                MovieCategoryInfos = string.Join(", ", x.MovieCategories),
                IsCommingSoon = x.IsCommingSoon,
                ExpectedReleaseDate = x.ExpectedReleaseDate
            })
            .ToList();

        return (page, total);
    }
}
