using System;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.Comments;
using StackExchange.Redis;

namespace Cinema.Infrastructure.Services;

public class MovieViewBuffer : IMovieViewBuffer
{
    private readonly IConnectionMultiplexer _redis;

    public MovieViewBuffer(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    public async Task QueueMovieViewAsync(Guid movieId, Guid? userId, DateTime viewedAt)
    {
        var db = _redis.GetDatabase();
        var dto = new RedisMovieViewDto
        {
            MovieId = movieId,
            UserId = userId,
            ViewedAt = viewedAt
        };
        var payload = JsonSerializer.Serialize(dto);
        await db.ListRightPushAsync("cinema:movie_views_queue", payload);
    }
}
