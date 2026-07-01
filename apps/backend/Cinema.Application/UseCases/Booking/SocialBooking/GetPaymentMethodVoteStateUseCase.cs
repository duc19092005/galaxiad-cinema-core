using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class GetPaymentMethodVoteStateUseCase
{
    private readonly IGroupBookingRepository _repo;
    private readonly IUserContextService _userContext;
    private readonly IGroupBookingCacheService _cache;

    public GetPaymentMethodVoteStateUseCase(IGroupBookingRepository repo, IUserContextService userContext, IGroupBookingCacheService cache)
    {
        _repo = repo;
        _userContext = userContext;
        _cache = cache;
    }

    public async Task<BaseResponse<ResPaymentMethodVoteStateDto>> ExecuteAsync(Guid groupSessionId)
    {
        var userId = _userContext.GetUserId();
        var session = await _repo.GetSessionByIdAsync(groupSessionId)
            ?? throw new NotFoundException("Group booking session not found");

        var votes = await _cache.GetAllPaymentVotesAsync(groupSessionId);
        var totalMembers = await _repo.GetMemberCountAsync(groupSessionId);
        var endTime = await _cache.GetVoteEndTimeAsync(groupSessionId);

        var voteCounts = votes.Values.GroupBy(v => v)
            .ToDictionary(g => (GroupBookingPaymentMethodEnum)g.Key, g => g.Count());

        return new BaseResponse<ResPaymentMethodVoteStateDto>
        {
            IsSuccess = true,
            Data = new ResPaymentMethodVoteStateDto
            {
                VoteStatus = session.VoteStatus,
                ResultMethod = session.PaymentMethod,
                Votes = votes.Select(kv => new ResPaymentMethodVoteDto
                {
                    UserId = kv.Key,
                    PaymentMethod = (GroupBookingPaymentMethodEnum)kv.Value,
                    VotedAt = DateTime.UtcNow
                }).ToList(),
                TotalMembers = totalMembers,
                VotedCount = votes.Count,
                HasVoted = votes.ContainsKey(userId),
                VoteCounts = voteCounts,
                VoteExpiresAt = endTime
            },
            Message = "OK"
        };
    }
}
