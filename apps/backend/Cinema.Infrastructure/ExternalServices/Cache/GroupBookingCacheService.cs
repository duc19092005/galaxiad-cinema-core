using System.Text.Json;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Dtos.Booking;
using StackExchange.Redis;

namespace Cinema.Infrastructure.ExternalServices.Cache;

public class GroupBookingCacheService : IGroupBookingCacheService
{
    private readonly IConnectionMultiplexer _redis;
    private static readonly JsonSerializerOptions _jsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public GroupBookingCacheService(IConnectionMultiplexer redis) => _redis = redis;
    private IDatabase Db() => _redis.GetDatabase();

    // ===== Keys =====
    private static string VoteEndTimeKey(Guid id) => $"group:{id}:vote:endtime";
    private static string VoteDataKey(Guid id) => $"group:{id}:vote:data";
    private static string PairsKey(Guid id) => $"group:{id}:pairs";
    private static string PendingPairKey(Guid id, string pairId) => $"group:{id}:pair:pending:{pairId}";
    private static string FailVoteKey(Guid id, Guid mid) => $"group:{id}:fail:votes:{mid}";
    private static string FailHandKey(Guid id, Guid mid) => $"group:{id}:fail:hands:{mid}";
    private static string FailureResolutionKey(Guid id) => $"group:{id}:fail:resolution";

    // ===== Payment Method Vote =====
    public async Task SetVoteEndTimeAsync(Guid groupSessionId, DateTime endTime, TimeSpan ttl)
    {
        await Db().StringSetAsync(VoteEndTimeKey(groupSessionId), endTime.Ticks.ToString(), ttl);
    }

    public async Task<DateTime?> GetVoteEndTimeAsync(Guid groupSessionId)
    {
        var val = await Db().StringGetAsync(VoteEndTimeKey(groupSessionId));
        return val.HasValue ? new DateTime(long.Parse(val!), DateTimeKind.Utc) : null;
    }

    public async Task SetPaymentVoteAsync(Guid groupSessionId, Guid userId, int method, TimeSpan ttl)
    {
        await Db().HashSetAsync(VoteDataKey(groupSessionId), userId.ToString(), method.ToString());
        await Db().KeyExpireAsync(VoteDataKey(groupSessionId), ttl);
    }

    public async Task<Dictionary<Guid, int>> GetAllPaymentVotesAsync(Guid groupSessionId)
    {
        var entries = await Db().HashGetAllAsync(VoteDataKey(groupSessionId));
        return entries.ToDictionary(
            e => Guid.Parse(e.Name!),
            e => int.Parse(e.Value!));
    }

    public async Task ClearPaymentVotesAsync(Guid groupSessionId)
    {
        await Db().KeyDeleteAsync(VoteDataKey(groupSessionId));
        await Db().KeyDeleteAsync(VoteEndTimeKey(groupSessionId));
    }

    // ===== Pair System =====
    public async Task SetAcceptedPairAsync(Guid groupSessionId, Guid member1Id, Guid member2Id, TimeSpan ttl)
    {
        var db = Db();
        await db.HashSetAsync(PairsKey(groupSessionId), member1Id.ToString(), member2Id.ToString());
        await db.HashSetAsync(PairsKey(groupSessionId), member2Id.ToString(), member1Id.ToString());
        await db.KeyExpireAsync(PairsKey(groupSessionId), ttl);
    }

    public async Task<List<(Guid Member1Id, Guid Member2Id)>> GetAcceptedPairsAsync(Guid groupSessionId)
    {
        var entries = await Db().HashGetAllAsync(PairsKey(groupSessionId));
        var seen = new HashSet<string>();
        var result = new List<(Guid, Guid)>();
        foreach (var e in entries)
        {
            var m1 = Guid.Parse(e.Name!);
            var m2 = Guid.Parse(e.Value!);
            var key = string.Compare(m1.ToString(), m2.ToString()) < 0 ? $"{m1}:{m2}" : $"{m2}:{m1}";
            if (seen.Add(key)) result.Add((m1, m2));
        }
        return result;
    }

    public async Task<Guid?> GetPairForMemberAsync(Guid groupSessionId, Guid memberId)
    {
        var val = await Db().HashGetAsync(PairsKey(groupSessionId), memberId.ToString());
        return val.HasValue ? Guid.Parse(val!) : null;
    }

    public async Task SetPendingPairRequestAsync(Guid groupSessionId, string pairId, string jsonData, TimeSpan ttl)
    {
        await Db().StringSetAsync(PendingPairKey(groupSessionId, pairId), jsonData, ttl);
    }

    public async Task<string?> GetPendingPairRequestAsync(Guid groupSessionId, string pairId)
    {
        var val = await Db().StringGetAsync(PendingPairKey(groupSessionId, pairId));
        return val.HasValue ? val.ToString() : null;
    }

    public async Task DeletePendingPairRequestAsync(Guid groupSessionId, string pairId)
    {
        await Db().KeyDeleteAsync(PendingPairKey(groupSessionId, pairId));
    }

    // ===== Payment Failure Vote =====
    public async Task SetFailureVoteAsync(Guid groupSessionId, Guid failedMemberId, Guid voterUserId, int action, TimeSpan ttl)
    {
        var db = Db();
        var key = FailVoteKey(groupSessionId, failedMemberId);
        await db.HashSetAsync(key, voterUserId.ToString(), action.ToString());
        await db.KeyExpireAsync(key, ttl);
    }

    public async Task<Dictionary<Guid, int>> GetFailureVotesAsync(Guid groupSessionId, Guid failedMemberId)
    {
        var entries = await Db().HashGetAllAsync(FailVoteKey(groupSessionId, failedMemberId));
        return entries.ToDictionary(
            e => Guid.Parse(e.Name!),
            e => int.Parse(e.Value!));
    }

    public async Task AddRaiseHandAsync(Guid groupSessionId, Guid failedMemberId, Guid userId, TimeSpan ttl)
    {
        var db = Db();
        await db.SetAddAsync(FailHandKey(groupSessionId, failedMemberId), userId.ToString());
        await db.KeyExpireAsync(FailHandKey(groupSessionId, failedMemberId), ttl);
    }

    public async Task RemoveRaiseHandAsync(Guid groupSessionId, Guid failedMemberId, Guid userId)
    {
        await Db().SetRemoveAsync(FailHandKey(groupSessionId, failedMemberId), userId.ToString());
    }

    public async Task<List<Guid>> GetRaiseHandsAsync(Guid groupSessionId, Guid failedMemberId)
    {
        var members = await Db().SetMembersAsync(FailHandKey(groupSessionId, failedMemberId));
        return members.Select(m => Guid.Parse(m!)).ToList();
    }

    // ===== Failure Resolution State =====
    public async Task SetFailureResolutionStateAsync(Guid groupSessionId, ResPaymentFailureVoteStateDto state, TimeSpan ttl)
    {
        var db = Db();
        var json = JsonSerializer.Serialize(state, _jsonOpts);
        await db.StringSetAsync(FailureResolutionKey(groupSessionId), json, ttl);
    }

    public async Task<ResPaymentFailureVoteStateDto?> GetFailureResolutionStateAsync(Guid groupSessionId)
    {
        var val = await Db().StringGetAsync(FailureResolutionKey(groupSessionId));
        if (!val.HasValue) return null;
        return JsonSerializer.Deserialize<ResPaymentFailureVoteStateDto>(val!, _jsonOpts);
    }

    // ===== Cleanup =====
    public async Task ClearAllGroupDataAsync(Guid groupSessionId)
    {
        var db = Db();
        var prefix = $"group:{groupSessionId}:";
        var server = _redis.GetServer(_redis.GetEndPoints().First());
        var keys = server.Keys(pattern: $"{prefix}*").ToArray();
        if (keys.Length > 0)
            await db.KeyDeleteAsync(keys);
    }
}
