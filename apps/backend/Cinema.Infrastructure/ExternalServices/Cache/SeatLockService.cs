using System.Text.Json;
using Cinema.Application.Interfaces.Booking;
using StackExchange.Redis;

namespace Cinema.Infrastructure.ExternalServices.Cache;

public class SeatLockService : ISeatLockService
{
    private readonly IConnectionMultiplexer _redis;
    private static readonly TimeSpan RateLimitWindow = TimeSpan.FromMinutes(1);
    private const int RateLimitMaxOperations = 60;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public SeatLockService(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    private IDatabase Db() => _redis.GetDatabase();

    private static string Normalize(string value) => value.Trim().ToLowerInvariant();

    private static string LockKey(string scheduleId, string seatId) =>
        $"seatlock:{Normalize(scheduleId)}:{Normalize(seatId)}";

    private static string SchedulePattern(string scheduleId) =>
        $"seatlock:{Normalize(scheduleId)}:*";

    private static string RateLimitKey(string ownerToken) =>
        $"seatlock:rate:{Normalize(ownerToken)}";

    public async Task<SeatLockAcquireResult> TryLockSeatAsync(
        string scheduleId,
        string seatId,
        string userName,
        string ownerToken,
        string ownerType,
        TimeSpan ttl,
        Guid? groupSessionId = null,
        Guid? memberId = null,
        Guid? userSegmentId = null)
    {
        if (!await TryConsumeRateLimitAsync(ownerToken))
            return new SeatLockAcquireResult(false, "Too many seat lock operations. Please slow down.", null);

        var key = LockKey(scheduleId, seatId);
        var current = await Db().StringGetAsync(key);
        if (current.HasValue)
        {
            var currentLock = Deserialize(current!);
            if (currentLock?.OwnerToken == ownerToken)
            {
                var refreshedLock = currentLock with
                {
                    UserName = string.IsNullOrWhiteSpace(userName) ? currentLock.UserName : userName,
                    UserSegmentId = userSegmentId ?? currentLock.UserSegmentId,
                    CreatedAtUtc = DateTime.UtcNow
                };
                var refreshedJson = JsonSerializer.Serialize(refreshedLock, JsonOptions);
                await Db().StringSetAsync(key, refreshedJson, ttl, When.Exists);
                return new SeatLockAcquireResult(true, "Seat already locked by you", refreshedLock);
            }

            return new SeatLockAcquireResult(false, "Seat is locked by another user", currentLock);
        }

        var lockInfo = new SeatLockInfo(
            scheduleId,
            seatId,
            string.IsNullOrWhiteSpace(userName) ? "Guest" : userName,
            ownerToken,
            ownerType,
            groupSessionId,
            memberId,
            userSegmentId,
            DateTime.UtcNow);

        var json = JsonSerializer.Serialize(lockInfo, JsonOptions);
        var acquired = await Db().StringSetAsync(key, json, ttl, When.NotExists);
        if (acquired)
            return new SeatLockAcquireResult(true, "Seat locked successfully", lockInfo);

        current = await Db().StringGetAsync(key);
        return new SeatLockAcquireResult(false, "Seat is locked by another user", Deserialize(current!));
    }

    public async Task<bool> UnlockSeatAsync(string scheduleId, string seatId, string ownerToken)
    {
        if (!await TryConsumeRateLimitAsync(ownerToken))
            return false;

        var key = LockKey(scheduleId, seatId);
        var current = await Db().StringGetAsync(key);
        if (!current.HasValue)
            return true;

        var lockInfo = Deserialize(current!);
        if (lockInfo?.OwnerToken != ownerToken)
            return false;

        const string luaScript = """
            if redis.call('get', KEYS[1]) == ARGV[1] then
                return redis.call('del', KEYS[1])
            end
            return 0
            """;

        var result = await Db().ScriptEvaluateAsync(
            luaScript,
            new RedisKey[] { key },
            new RedisValue[] { current });

        return (int)result == 1;
    }

    public async Task ForceUnlockSeatAsync(string scheduleId, string seatId)
    {
        await Db().KeyDeleteAsync(LockKey(scheduleId, seatId));
    }

    public async Task<SeatLockRenewResult> RenewLocksForOwnerAsync(string scheduleId, string ownerToken, TimeSpan ttl)
    {
        if (!await TryConsumeRateLimitAsync(ownerToken))
            return new SeatLockRenewResult(false, "Too many seat lock operations. Please slow down.", []);

        var locks = await GetLocksForOwnerAsync(scheduleId, ownerToken);
        if (locks.Count == 0)
            return new SeatLockRenewResult(false, "No active seat locks found for this session.", []);

        var renewed = new List<SeatLockInfo>();
        const string luaScript = """
            if redis.call('get', KEYS[1]) == ARGV[1] then
                return redis.call('pexpire', KEYS[1], ARGV[2])
            end
            return 0
            """;

        foreach (var lockInfo in locks)
        {
            var key = LockKey(lockInfo.ScheduleId, lockInfo.SeatId);
            var current = await Db().StringGetAsync(key);
            if (!current.HasValue)
                continue;

            var currentLock = Deserialize(current!);
            if (currentLock?.OwnerToken != ownerToken)
                continue;

            var result = await Db().ScriptEvaluateAsync(
                luaScript,
                new RedisKey[] { key },
                new RedisValue[] { current, (long)ttl.TotalMilliseconds });

            if ((int)result == 1)
                renewed.Add(currentLock);
        }

        return renewed.Count > 0
            ? new SeatLockRenewResult(true, "Seat locks renewed successfully.", renewed)
            : new SeatLockRenewResult(false, "Seat locks could not be renewed.", []);
    }

    public async Task ReleaseSeatsByOwnerAsync(string ownerToken)
    {
        var db = Db();
        var locks = await GetLocksForOwnerAsync(ownerToken);
        var keys = locks.Select(l => (RedisKey)LockKey(l.ScheduleId, l.SeatId)).ToArray();
        if (keys.Length > 0)
            await db.KeyDeleteAsync(keys);
    }

    public async Task ReleaseSeatsForScheduleAsync(string scheduleId, IEnumerable<string> seatIds)
    {
        var keys = seatIds.Select(seatId => (RedisKey)LockKey(scheduleId, seatId)).ToArray();
        if (keys.Length > 0)
            await Db().KeyDeleteAsync(keys);
    }

    public async Task<IReadOnlyList<SeatLockInfo>> GetLocksForScheduleAsync(string scheduleId)
    {
        var locks = new List<SeatLockInfo>();
        var db = Db();

        foreach (var endpoint in _redis.GetEndPoints())
        {
            var server = _redis.GetServer(endpoint);
            if (server.IsReplica) continue;

            foreach (var key in server.Keys(pattern: SchedulePattern(scheduleId)))
            {
                var value = await db.StringGetAsync(key);
                var lockInfo = value.HasValue ? Deserialize(value!) : null;
                if (lockInfo != null)
                    locks.Add(lockInfo);
            }
        }

        return locks;
    }

    public async Task<IReadOnlyList<SeatLockInfo>> GetLocksForOwnerAsync(string scheduleId, string ownerToken)
    {
        var locks = await GetLocksForScheduleAsync(scheduleId);
        return locks.Where(l => l.OwnerToken == ownerToken).ToList();
    }

    public async Task<IReadOnlyList<SeatLockInfo>> GetLocksForOwnerAsync(string ownerToken)
    {
        var locks = new List<SeatLockInfo>();
        var db = Db();

        foreach (var endpoint in _redis.GetEndPoints())
        {
            var server = _redis.GetServer(endpoint);
            if (server.IsReplica) continue;

            foreach (var key in server.Keys(pattern: "seatlock:*"))
            {
                var value = await db.StringGetAsync(key);
                var lockInfo = value.HasValue ? Deserialize(value!) : null;
                if (lockInfo?.OwnerToken == ownerToken)
                    locks.Add(lockInfo);
            }
        }

        return locks;
    }

    private static SeatLockInfo? Deserialize(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;

        try
        {
            return JsonSerializer.Deserialize<SeatLockInfo>(json, JsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private async Task<bool> TryConsumeRateLimitAsync(string ownerToken)
    {
        if (string.IsNullOrWhiteSpace(ownerToken))
            ownerToken = "anonymous";

        var key = RateLimitKey(ownerToken);
        var db = Db();
        var count = await db.StringIncrementAsync(key);
        if (count == 1)
            await db.KeyExpireAsync(key, RateLimitWindow);

        return count <= RateLimitMaxOperations;
    }
}
