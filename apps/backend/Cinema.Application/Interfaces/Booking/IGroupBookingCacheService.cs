using Cinema.Application.Dtos.Booking;

namespace Cinema.Application.Interfaces.Booking;

public interface IGroupBookingCacheService
{
    // Payment Method Vote
    Task SetVoteEndTimeAsync(Guid groupSessionId, DateTime endTime, TimeSpan ttl);
    Task<DateTime?> GetVoteEndTimeAsync(Guid groupSessionId);
    Task SetPaymentVoteAsync(Guid groupSessionId, Guid userId, int method, TimeSpan ttl);
    Task<Dictionary<Guid, int>> GetAllPaymentVotesAsync(Guid groupSessionId);
    Task ClearPaymentVotesAsync(Guid groupSessionId);

    // Pair System
    Task SetAcceptedPairAsync(Guid groupSessionId, Guid member1Id, Guid member2Id, TimeSpan ttl);
    Task<List<(Guid Member1Id, Guid Member2Id)>> GetAcceptedPairsAsync(Guid groupSessionId);
    Task<Guid?> GetPairForMemberAsync(Guid groupSessionId, Guid memberId);
    Task SetPendingPairRequestAsync(Guid groupSessionId, string pairId, string jsonData, TimeSpan ttl);
    Task<string?> GetPendingPairRequestAsync(Guid groupSessionId, string pairId);
    Task DeletePendingPairRequestAsync(Guid groupSessionId, string pairId);

    // Payment Failure Vote
    Task SetFailureVoteAsync(Guid groupSessionId, Guid failedMemberId, Guid voterUserId, int action, TimeSpan ttl);
    Task<Dictionary<Guid, int>> GetFailureVotesAsync(Guid groupSessionId, Guid failedMemberId);
    Task AddRaiseHandAsync(Guid groupSessionId, Guid failedMemberId, Guid userId, TimeSpan ttl);
    Task RemoveRaiseHandAsync(Guid groupSessionId, Guid failedMemberId, Guid userId);
    Task<List<Guid>> GetRaiseHandsAsync(Guid groupSessionId, Guid failedMemberId);

    // Failure Resolution State
    Task SetFailureResolutionStateAsync(Guid groupSessionId, ResPaymentFailureVoteStateDto state, TimeSpan ttl);
    Task<ResPaymentFailureVoteStateDto?> GetFailureResolutionStateAsync(Guid groupSessionId);

    // Cleanup
    Task ClearAllGroupDataAsync(Guid groupSessionId);
}
