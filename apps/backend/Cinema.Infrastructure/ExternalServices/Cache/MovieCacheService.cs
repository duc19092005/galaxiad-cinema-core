using System;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.IThirdPersonServices;
using StackExchange.Redis;

namespace Cinema.Infrastructure.Services;

public class MovieCacheService : IMovieCacheService
{
    private readonly IConnectionMultiplexer _redis;

    public MovieCacheService(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        var db = _redis.GetDatabase();
        var value = await db.StringGetAsync(key);
        if (value.IsNullOrEmpty)
        {
            return default;
        }

        try
        {
            return JsonSerializer.Deserialize<T>(value!);
        }
        catch
        {
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan ttl)
    {
        var db = _redis.GetDatabase();
        var serialized = JsonSerializer.Serialize(value);
        await db.StringSetAsync(key, serialized, ttl);
    }

    public async Task ClearMovieCatalogCacheAsync()
    {
        var db = _redis.GetDatabase();
        foreach (var endpoint in _redis.GetEndPoints())
        {
            var server = _redis.GetServer(endpoint);
            await foreach (var key in server.KeysAsync(pattern: "movies:showing:*"))
            {
                await db.KeyDeleteAsync(key);
            }
            await foreach (var key in server.KeysAsync(pattern: "movies:upcoming:*"))
            {
                await db.KeyDeleteAsync(key);
            }
        }
    }

    public async Task ClearMovieDetailCacheAsync(Guid movieId)
    {
        var db = _redis.GetDatabase();
        await db.KeyDeleteAsync($"movie:detail:{movieId}");
    }

    public async Task ClearUserCacheAsync(Guid userId)
    {
        var db = _redis.GetDatabase();
        await db.KeyDeleteAsync($"user:bookings:{userId}");
        await db.KeyDeleteAsync($"user:profile:{userId}");
    }
}
