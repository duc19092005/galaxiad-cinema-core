using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Application.Interfaces.Catalog;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Localization;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.Customer.Catalog;

/// <summary>
/// Person (actor/director) detail for public pages.
/// Filmography comes only from the internal movie catalog; TMDB is used optionally for profile photo.
/// </summary>
public class GetMoviePersonDetailUseCase
{
    private readonly IPublicCatalogRepository _repository;
    private readonly ITmdbMovieClient _tmdb;
    private readonly ILogger<GetMoviePersonDetailUseCase> _logger;

    public GetMoviePersonDetailUseCase(
        IPublicCatalogRepository repository,
        ITmdbMovieClient tmdb,
        ILogger<GetMoviePersonDetailUseCase> logger)
    {
        _repository = repository;
        _tmdb = tmdb;
        _logger = logger;
    }

    public async Task<BaseResponse<MoviePersonDetailRes>> ExecuteAsync(
        string name,
        string role,
        int pageIndex = 1,
        int pageSize = 12)
    {
        var personName = (name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(personName))
        {
            return new BaseResponse<MoviePersonDetailRes>
            {
                IsSuccess = false,
                Message = "Person name is required.",
                Data = null!
            };
        }

        var roleNorm = NormalizeRole(role);
        var (items, total) = await _repository.GetMoviesByPersonAsync(personName, roleNorm, pageIndex, pageSize);

        // If no catalog movies and name is not known at all, still return empty filmography
        // so UI can show "not found" when total is 0 and no profile.
        var detail = new MoviePersonDetailRes
        {
            Name = personName,
            Role = roleNorm,
            Movies = new PagedResult<MovieInfoRes>(items, total, pageIndex < 1 ? 1 : pageIndex, pageSize is < 1 or > 48 ? 12 : pageSize)
        };

        try
        {
            var tmdbPerson = await _tmdb.FindPersonByNameAsync(personName);
            if (tmdbPerson != null)
            {
                if (!string.IsNullOrWhiteSpace(tmdbPerson.Name))
                    detail.Name = tmdbPerson.Name;
                detail.ProfileUrl = tmdbPerson.ProfileUrl;
                detail.TmdbId = tmdbPerson.TmdbId;
                detail.KnownForDepartment = tmdbPerson.KnownForDepartment;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "TMDB profile enrich failed for person {Name}", personName);
        }

        return new BaseResponse<MoviePersonDetailRes>
        {
            IsSuccess = true,
            Message = Messages.Catalog.GetMovieDetailSuccess,
            Data = detail
        };
    }

    private static string NormalizeRole(string? role)
    {
        var r = (role ?? "actor").Trim().ToLowerInvariant();
        return r is "director" or "directing" or "dao-dien" or "đạo-diễn" or "daodien"
            ? "director"
            : "actor";
    }
}
