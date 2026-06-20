using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Application.Interfaces.Comments;

public record MovieBehaviorSignal(Guid MovieId, int Count, DateTime LastAt);

public class RedisMovieViewDto
{
    public Guid MovieId { get; set; }
    public Guid? UserId { get; set; }
    public DateTime ViewedAt { get; set; }
}

public interface IRecommendationRepository
{
    Task<UserGenreSurveyEntity?> GetSurveyByUserIdAsync(Guid userId);
    Task AddSurveyAsync(UserGenreSurveyEntity survey);
    Task UpdateSurveyAsync(UserGenreSurveyEntity survey);
    Task<List<string>> GetMovieGenreNamesAsync(List<string> genreIds);
    Task<List<MovieBehaviorSignal>> GetViewedMovieSignalsAsync(Guid userId, int take);
    Task<List<MovieBehaviorSignal>> GetBookedMovieSignalsAsync(Guid userId, int take);
    Task<List<MovieBehaviorSignal>> GetPositiveRatingSignalsAsync(Guid userId, int take);
    Task<List<string>> LoadMoviePreferenceSnippetsAsync(IEnumerable<Guid> movieIds);
    Task<List<RecommendedMovieRes>> LoadRecommendedMoviesAsync(List<Guid> movieIds);
    Task<List<RecommendedMovieRes>> GetFallbackRecommendationsAsync(HashSet<Guid> excludedMovieIds, int take);
    Task<List<MovieInfoEntity>> GetActiveMoviesForEmbeddingAsync(CancellationToken cancellationToken);
    Task<MovieInfoEntity?> GetMovieForEmbeddingAsync(Guid movieId, CancellationToken cancellationToken);
    Task SaveChangesAsync();
}
