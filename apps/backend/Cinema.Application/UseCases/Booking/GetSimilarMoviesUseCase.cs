using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Localization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.Booking;

public class GetSimilarMoviesUseCase
{
    private readonly IBookingCatalogRepository _repository;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly IMovieCacheService _cacheService;
    private readonly ILogger<GetSimilarMoviesUseCase> _logger;

    public GetSimilarMoviesUseCase(
        IBookingCatalogRepository repository,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        IMovieCacheService cacheService,
        ILogger<GetSimilarMoviesUseCase> logger)
    {
        _repository = repository;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _cacheService = cacheService;
        _logger = logger;
    }

    public async Task<BaseResponse<List<ResPublicMovieListDto>>> ExecuteAsync(Guid movieId, CancellationToken cancellationToken)
    {
        var cacheKey = $"movies:similar:{movieId}";
        var cached = await _cacheService.GetAsync<BaseResponse<List<ResPublicMovieListDto>>>(cacheKey);
        if (cached != null)
        {
            return cached;
        }

        var targetMovie = await _repository.GetMovieDetailAsync(movieId);
        if (targetMovie == null)
        {
            throw new NotFoundException(Messages.Movie.NotFoundById(movieId));
        }

        // 1. Load candidate pool (Now Showing + Coming Soon)
        var showingMovies = await _repository.GetNowShowingMoviesPagedAsync(null, 0, 100);
        var comingSoonMovies = await _repository.GetComingSoonMoviesPagedAsync(null, 0, 100);
        var candidates = showingMovies.Concat(comingSoonMovies)
            .GroupBy(m => m.MovieId)
            .Select(g => g.First())
            .Where(m => m.MovieId != movieId)
            .ToList();

        List<MovieInfoEntity> similarMovies = [];

        // 2. Attempt AI embedding similarity recommendation
        var genresStr = string.Join(", ", targetMovie.MovieGenreMovieInfoEntity
            .Select(g => g.MovieGenreInfoEntity.MovieGenreName));
        var userText = $"Tên phim: {targetMovie.MovieName}. Thể loại: {genresStr}. Mô tả: {targetMovie.MovieDescription}. Đạo diễn: {targetMovie.Director}. Diễn viên: {targetMovie.Actors}";

        try
        {
            var aiServiceUrl = _configuration["AiService:BaseUrl"] ?? "http://cinema-ai-service:8000";
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(5);

            var reqBody = new AiRecommendRequest { UserText = userText, TopK = 12 };
            var content = new StringContent(JsonSerializer.Serialize(reqBody), Encoding.UTF8, "application/json");

            var response = await client.PostAsync($"{aiServiceUrl}/recommend", content, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                var aiResult = JsonSerializer.Deserialize<AiRecommendResponse>(
                    await response.Content.ReadAsStringAsync(cancellationToken),
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (aiResult?.Results != null && aiResult.Results.Count > 0)
                {
                    var aiMovieIds = aiResult.Results
                        .Select(r => Guid.TryParse(r.MovieId, out var id) ? id : Guid.Empty)
                        .Where(id => id != Guid.Empty && id != movieId)
                        .Distinct()
                        .ToList();

                    // Find corresponding pre-loaded movies in the candidate pool preserving AI ordering
                    similarMovies = aiMovieIds
                        .Select(id => candidates.FirstOrDefault(c => c.MovieId == id))
                        .Where(m => m != null)
                        .Cast<MovieInfoEntity>()
                        .Take(6)
                        .ToList();
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch AI-based similar movies for {MovieId}. Falling back to database genre-matching.", movieId);
        }

        // 3. Fallback: Database-based genre matching
        if (similarMovies.Count < 6)
        {
            var targetGenreIds = targetMovie.MovieGenreMovieInfoEntity
                .Select(g => g.MovieGenreId)
                .ToHashSet();

            var currentSimilarIds = similarMovies.Select(m => m.MovieId).ToHashSet();

            var dbSimilar = candidates
                .Where(m => !currentSimilarIds.Contains(m.MovieId))
                .Select(m => new
                {
                    Movie = m,
                    MatchedGenreCount = m.MovieGenreMovieInfoEntity.Count(g => targetGenreIds.Contains(g.MovieGenreId))
                })
                .Where(x => x.MatchedGenreCount > 0)
                .OrderByDescending(x => x.MatchedGenreCount)
                .ThenByDescending(x => x.Movie.EndedDate)
                .Select(x => x.Movie)
                .Take(6 - similarMovies.Count)
                .ToList();

            similarMovies.AddRange(dbSimilar);
        }

        // If we still don't have enough similar movies, grab random active movies as a final fallback
        if (similarMovies.Count < 6)
        {
            var currentSimilarIds = similarMovies.Select(m => m.MovieId).ToHashSet();
            var extraMovies = candidates
                .Where(m => !currentSimilarIds.Contains(m.MovieId))
                .Take(6 - similarMovies.Count)
                .ToList();
            similarMovies.AddRange(extraMovies);
        }

        var dtoList = similarMovies.Select(x => new ResPublicMovieListDto
        {
            MovieId = x.MovieId,
            MovieName = x.MovieName,
            MovieImageUrl = x.MovieImageUrl,
            MovieDescription = x.MovieDescription,
            MovieDuration = x.MovieDuration,
            StartedDate = x.ActiveAt,
            EndedDate = x.EndedDate,
            MovieRequiredAgeSymbol = x.MovieRequiredAgeEntity?.MovieRequiredAgeSymbol.Trim() ?? "P",
            MovieGenres = x.MovieGenreMovieInfoEntity
                .Select(g => g.MovieGenreInfoEntity.MovieGenreName).ToList(),
            MovieFormats = x.MovieFormatMovieInfoEntity
                .Select(f => f.MovieFormatInfoEntity.MovieFormatName).ToList()
        }).ToList();

        var finalResponse = new BaseResponse<List<ResPublicMovieListDto>>
        {
            IsSuccess = true,
            Data = dtoList,
            Message = Messages.Movie.GetListSuccess
        };

        await _cacheService.SetAsync(cacheKey, finalResponse, TimeSpan.FromMinutes(30));
        return finalResponse;
    }
}
