using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace Cinema.Infrastructure.ExternalServices.Cache;

public interface IMovieInterestBuffer
{
    Task IncrementInterestAsync(Guid movieId);
    Task<Dictionary<string, long>> GetAllInterestsAsync();
    Task SyncToDbAsync(IServiceProvider serviceProvider);
}

public class MovieInterestBuffer : IMovieInterestBuffer
{
    private readonly IConnectionMultiplexer _redis;
    private const string HashKey = "cinema:movie_interest";

    public MovieInterestBuffer(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    public async Task IncrementInterestAsync(Guid movieId)
    {
        var db = _redis.GetDatabase();
        await db.HashIncrementAsync(HashKey, movieId.ToString());
    }

    public async Task<Dictionary<string, long>> GetAllInterestsAsync()
    {
        var db = _redis.GetDatabase();
        var entries = await db.HashGetAllAsync(HashKey);
        var result = new Dictionary<string, long>();
        foreach (var entry in entries)
        {
            if (entry.Value.HasValue && long.TryParse(entry.Value.ToString(), out var count))
            {
                result[entry.Key.ToString()] = count;
            }
        }
        return result;
    }

    public async Task SyncToDbAsync(IServiceProvider serviceProvider)
    {
        var db = _redis.GetDatabase();
        var entries = await db.HashGetAllAsync(HashKey);
        if (entries.Length == 0) return;

        using var scope = serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<Infrastructure.CinemaDbContext>();

        foreach (var entry in entries)
        {
            if (!Guid.TryParse(entry.Key.ToString(), out var movieId)) continue;
            if (!long.TryParse(entry.Value.ToString(), out var redisCount) || redisCount <= 0) continue;

            var movie = await dbContext.MovieInfoEntity.FindAsync(movieId);
            if (movie != null)
            {
                movie.InterestCount += (int)redisCount;
            }
        }

        await dbContext.SaveChangesAsync();
        await db.KeyDeleteAsync(HashKey);
    }
}
