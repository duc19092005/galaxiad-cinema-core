using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Application.Interfaces.Catalog;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Localization;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.Customer.Catalog;

public class GetMovieDetailUseCase
{
    private readonly IPublicCatalogRepository _repository;
    private readonly ITmdbMovieClient _tmdb;
    private readonly ILogger<GetMovieDetailUseCase> _logger;

    public GetMovieDetailUseCase(
        IPublicCatalogRepository repository,
        ITmdbMovieClient tmdb,
        ILogger<GetMovieDetailUseCase> logger)
    {
        _repository = repository;
        _tmdb = tmdb;
        _logger = logger;
    }

    public async Task<BaseResponse<MovieDetailInfoRes>> ExecuteAsync(Guid movieId)
    {
        var detail = await _repository.GetMovieDetailAsync(movieId);
        if (detail != null)
        {
            await EnrichPeopleAsync(detail);
        }

        return new BaseResponse<MovieDetailInfoRes>
        {
            Data = detail!,
            IsSuccess = true,
            Message = Messages.Catalog.GetMovieDetailSuccess
        };
    }

    private async Task EnrichPeopleAsync(MovieDetailInfoRes detail)
    {
        var directorNames = SplitPeople(detail.Director);
        var castNames = SplitPeople(detail.Actor).Take(12).ToList();

        // Seed with names so UI always has cards even if TMDB is down
        detail.Directors = directorNames
            .Select(n => new MoviePersonRes { Name = n })
            .ToList();
        detail.Cast = castNames
            .Select(n => new MoviePersonRes { Name = n })
            .ToList();

        var uniqueNames = directorNames
            .Concat(castNames)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (uniqueNames.Count == 0) return;

        try
        {
            var lookups = await Task.WhenAll(uniqueNames.Select(async name =>
            {
                var person = await _tmdb.FindPersonByNameAsync(name);
                return (Name: name, Person: person);
            }));

            var byName = lookups
                .Where(x => x.Person != null)
                .ToDictionary(
                    x => x.Name,
                    x => x.Person!,
                    StringComparer.OrdinalIgnoreCase);

            foreach (var d in detail.Directors)
            {
                if (byName.TryGetValue(d.Name, out var p))
                {
                    d.ProfileUrl = p.ProfileUrl;
                    d.TmdbId = p.TmdbId;
                    if (!string.IsNullOrWhiteSpace(p.Name)) d.Name = p.Name;
                }
            }

            foreach (var c in detail.Cast)
            {
                if (byName.TryGetValue(c.Name, out var p))
                {
                    c.ProfileUrl = p.ProfileUrl;
                    c.TmdbId = p.TmdbId;
                    if (!string.IsNullOrWhiteSpace(p.Name)) c.Name = p.Name;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to enrich movie people from TMDB for movie {MovieId}", detail.MovieId);
        }
    }

    private static List<string> SplitPeople(string? raw) =>
        string.IsNullOrWhiteSpace(raw)
            ? []
            : raw
                .Split(new[] { ',', ';', '|' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
}
