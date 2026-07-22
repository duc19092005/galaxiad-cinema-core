using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Cinema.Application.Dtos.MovieManager.Responses;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Cinema.Infrastructure.ExternalServices.Tmdb;

public class TmdbMovieClient : ITmdbMovieClient
{
    private readonly HttpClient _http;
    private readonly ILogger<TmdbMovieClient> _logger;
    private readonly string _apiKey;
    private readonly string _imageBase;

    public TmdbMovieClient(HttpClient http, IConfiguration config, ILogger<TmdbMovieClient> logger)
    {
        _http = http;
        _logger = logger;
        _apiKey = config["Tmdb:ApiKey"]
            ?? config["TMDB_API_KEY"]
            ?? Environment.GetEnvironmentVariable("TMDB_API_KEY")
            ?? string.Empty;
        _imageBase = (config["Tmdb:ImageBaseUrl"] ?? "https://image.tmdb.org/t/p/w185").TrimEnd('/');
    }

    public async Task<List<ExternalMovieSearchItemDto>> SearchMoviesAsync(string query, CancellationToken ct = default)
    {
        EnsureApiKey();
        if (string.IsNullOrWhiteSpace(query)) return await GetPopularMoviesAsync(ct);

        var url = $"search/movie?query={Uri.EscapeDataString(query.Trim())}&include_adult=false&language=en-US&page=1";
        var payload = await GetAsync<TmdbMovieSearchResponse>(url, ct);
        return MapMovies(payload?.Results);
    }

    public async Task<List<ExternalMovieSearchItemDto>> GetPopularMoviesAsync(CancellationToken ct = default)
    {
        EnsureApiKey();
        var payload = await GetAsync<TmdbMovieSearchResponse>("movie/popular?language=en-US&page=1", ct);
        return MapMovies(payload?.Results);
    }

    private List<ExternalMovieSearchItemDto> MapMovies(List<TmdbMovieResult>? results) =>
        (results ?? [])
            .Select(m => new ExternalMovieSearchItemDto
            {
                TmdbId = m.Id,
                Title = m.Title ?? m.OriginalTitle ?? $"#{m.Id}",
                OriginalTitle = m.OriginalTitle,
                ReleaseDate = m.ReleaseDate,
                Overview = m.Overview,
                PosterUrl = ToImageUrl(m.PosterPath)
            })
            .ToList();

    public async Task<ExternalMovieCreditsDto?> GetMovieCreditsAsync(int tmdbMovieId, CancellationToken ct = default)
    {
        EnsureApiKey();
        if (tmdbMovieId <= 0) return null;

        var movieTask = GetAsync<TmdbMovieDetail>($"movie/{tmdbMovieId}?language=en-US", ct);
        var creditsTask = GetAsync<TmdbCreditsResponse>($"movie/{tmdbMovieId}/credits?language=en-US", ct);
        await Task.WhenAll(movieTask, creditsTask);

        var movie = await movieTask;
        var credits = await creditsTask;
        if (movie == null && credits == null) return null;

        var directors = (credits?.Crew ?? [])
            .Where(c => string.Equals(c.Job, "Director", StringComparison.OrdinalIgnoreCase)
                        && !string.IsNullOrWhiteSpace(c.Name))
            .Select(c => c.Name!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var cast = (credits?.Cast ?? [])
            .Where(c => !string.IsNullOrWhiteSpace(c.Name))
            .OrderBy(c => c.Order)
            .Take(40)
            .Select(c => new ExternalCastMemberDto
            {
                TmdbId = c.Id,
                Name = c.Name!.Trim(),
                Character = c.Character,
                ProfileUrl = ToImageUrl(c.ProfilePath),
                Order = c.Order
            })
            .ToList();

        return new ExternalMovieCreditsDto
        {
            TmdbId = tmdbMovieId,
            Title = movie?.Title ?? movie?.OriginalTitle ?? $"#{tmdbMovieId}",
            Directors = directors,
            Cast = cast
        };
    }

    public async Task<List<ExternalPersonSearchItemDto>> SearchPeopleAsync(string query, CancellationToken ct = default)
    {
        EnsureApiKey();
        if (string.IsNullOrWhiteSpace(query)) return await GetPopularPeopleAsync(ct);

        var url = $"search/person?query={Uri.EscapeDataString(query.Trim())}&include_adult=false&language=en-US&page=1";
        var payload = await GetAsync<TmdbPersonSearchResponse>(url, ct);
        return MapPeople(payload?.Results);
    }

    public async Task<List<ExternalPersonSearchItemDto>> GetPopularPeopleAsync(CancellationToken ct = default)
    {
        EnsureApiKey();
        var payload = await GetAsync<TmdbPersonSearchResponse>("person/popular?language=en-US&page=1", ct);
        return MapPeople(payload?.Results);
    }

    private List<ExternalPersonSearchItemDto> MapPeople(List<TmdbPersonResult>? results) =>
        (results ?? [])
            .Where(p => !string.IsNullOrWhiteSpace(p.Name))
            .OrderByDescending(p => p.Popularity)
            .Take(30)
            .Select(p => new ExternalPersonSearchItemDto
            {
                TmdbId = p.Id,
                Name = p.Name!.Trim(),
                KnownForDepartment = p.KnownForDepartment,
                ProfileUrl = ToImageUrl(p.ProfilePath),
                Popularity = p.Popularity
            })
            .ToList();

    private void EnsureApiKey()
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            throw new InvalidOperationException(
                "TMDB API key is not configured. Set Tmdb:ApiKey in appsettings or TMDB_API_KEY environment variable. Get a free key at https://www.themoviedb.org/settings/api");
        }
    }

    private string? ToImageUrl(string? path)
    {
        if (string.IsNullOrWhiteSpace(path)) return null;
        return $"{_imageBase}/{path.TrimStart('/')}";
    }

    private async Task<T?> GetAsync<T>(string relativeUrl, CancellationToken ct)
    {
        var sep = relativeUrl.Contains('?') ? '&' : '?';
        var url = $"{relativeUrl}{sep}api_key={Uri.EscapeDataString(_apiKey)}";
        try
        {
            using var response = await _http.GetAsync(url, ct);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(ct);
                _logger.LogWarning("TMDB {Url} failed: {Status} {Body}", relativeUrl, (int)response.StatusCode, body);
                response.EnsureSuccessStatusCode();
            }
            return await response.Content.ReadFromJsonAsync<T>(cancellationToken: ct);
        }
        catch (Exception ex) when (ex is not InvalidOperationException)
        {
            _logger.LogError(ex, "TMDB request failed: {Url}", relativeUrl);
            throw;
        }
    }

    private sealed class TmdbMovieSearchResponse
    {
        [JsonPropertyName("results")]
        public List<TmdbMovieResult> Results { get; set; } = [];
    }

    private sealed class TmdbMovieResult
    {
        [JsonPropertyName("id")] public int Id { get; set; }
        [JsonPropertyName("title")] public string? Title { get; set; }
        [JsonPropertyName("original_title")] public string? OriginalTitle { get; set; }
        [JsonPropertyName("release_date")] public string? ReleaseDate { get; set; }
        [JsonPropertyName("overview")] public string? Overview { get; set; }
        [JsonPropertyName("poster_path")] public string? PosterPath { get; set; }
    }

    private sealed class TmdbMovieDetail
    {
        [JsonPropertyName("id")] public int Id { get; set; }
        [JsonPropertyName("title")] public string? Title { get; set; }
        [JsonPropertyName("original_title")] public string? OriginalTitle { get; set; }
    }

    private sealed class TmdbCreditsResponse
    {
        [JsonPropertyName("cast")] public List<TmdbCastMember> Cast { get; set; } = [];
        [JsonPropertyName("crew")] public List<TmdbCrewMember> Crew { get; set; } = [];
    }

    private sealed class TmdbCastMember
    {
        [JsonPropertyName("id")] public int Id { get; set; }
        [JsonPropertyName("name")] public string? Name { get; set; }
        [JsonPropertyName("character")] public string? Character { get; set; }
        [JsonPropertyName("profile_path")] public string? ProfilePath { get; set; }
        [JsonPropertyName("order")] public int Order { get; set; }
    }

    private sealed class TmdbCrewMember
    {
        [JsonPropertyName("id")] public int Id { get; set; }
        [JsonPropertyName("name")] public string? Name { get; set; }
        [JsonPropertyName("job")] public string? Job { get; set; }
        [JsonPropertyName("department")] public string? Department { get; set; }
    }

    private sealed class TmdbPersonSearchResponse
    {
        [JsonPropertyName("results")]
        public List<TmdbPersonResult> Results { get; set; } = [];
    }

    private sealed class TmdbPersonResult
    {
        [JsonPropertyName("id")] public int Id { get; set; }
        [JsonPropertyName("name")] public string? Name { get; set; }
        [JsonPropertyName("known_for_department")] public string? KnownForDepartment { get; set; }
        [JsonPropertyName("profile_path")] public string? ProfilePath { get; set; }
        [JsonPropertyName("popularity")] public double Popularity { get; set; }
    }
}
