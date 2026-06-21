using Cinema.Application.Interfaces.IThirdPersonServices;
using StackExchange.Redis;

namespace Cinema.Infrastructure.Services;

public class RedisLockService : IRedisLockService
{
    private readonly IDatabase _database;

    public RedisLockService(IConnectionMultiplexer connectionMultiplexer)
    {
        _database = connectionMultiplexer.GetDatabase();
    }

    public async Task<bool> AcquireLockAsync(string key, string value, TimeSpan expiration)
    {
        return await _database.StringSetAsync(key, value, expiration, When.NotExists);
    }

    public async Task<bool> ReleaseLockAsync(string key, string value)
    {
        var luaScript = @"
            if redis.call('get', KEYS[1]) == ARGV[1] then
                return redis.call('del', KEYS[1])
            else
                return 0
            end";

        var result = await _database.ScriptEvaluateAsync(luaScript, new RedisKey[] { key }, new RedisValue[] { value });
        return (int)result == 1;
    }
}
