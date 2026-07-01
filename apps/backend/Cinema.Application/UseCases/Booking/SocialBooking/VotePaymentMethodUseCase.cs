using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class VotePaymentMethodUseCase
{
    private readonly IGroupBookingRepository _repo;
    private readonly IUserContextService _userContext;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISeatLockerNotificationService _notification;
    private readonly IGroupBookingCacheService _cache;
    private readonly IVoteTimeoutScheduler _voteTimeoutScheduler;
    private readonly ILogger<VotePaymentMethodUseCase> _logger;

    public const int VoteTimeoutSeconds = 60;

    public VotePaymentMethodUseCase(
        IGroupBookingRepository repo,
        IUserContextService userContext,
        IUnitOfWork unitOfWork,
        ISeatLockerNotificationService notification,
        IGroupBookingCacheService cache,
        IVoteTimeoutScheduler voteTimeoutScheduler,
        ILogger<VotePaymentMethodUseCase> logger)
    {
        _repo = repo;
        _userContext = userContext;
        _unitOfWork = unitOfWork;
        _notification = notification;
        _cache = cache;
        _voteTimeoutScheduler = voteTimeoutScheduler;
        _logger = logger;
    }

    public async Task<BaseResponse<ResPaymentMethodVoteStateDto>> ExecuteAsync(Guid groupSessionId, ReqVotePaymentMethodDto request)
    {
        var userId = _userContext.GetUserId();
        var session = await _repo.GetSessionByIdAsync(groupSessionId)
            ?? throw new NotFoundException("Group booking session not found");

        if (session.Status != GroupBookingStatusEnum.Confirming)
            throw new BadRequestException("Cannot vote at this stage", "GBK40");

        var member = await _repo.GetMemberAsync(groupSessionId, userId)
            ?? throw new BadRequestException("You are not a member of this group", "GBK41");

        var cacheTtl = GroupBookingCacheTtl.ForGroup(session.ExpiresAt);

        await _cache.SetPaymentVoteAsync(groupSessionId, userId, (int)request.PaymentMethod, cacheTtl);

        // Start timer on first vote
        if (session.VoteStatus == GroupBookingVoteStatusEnum.None)
        {
            session.VoteStatus = GroupBookingVoteStatusEnum.Voting;
            _repo.UpdateSession(session);
            await _unitOfWork.SaveChangesAsync();

            var endTime = DateTime.UtcNow.AddSeconds(VoteTimeoutSeconds);
            await _cache.SetVoteEndTimeAsync(groupSessionId, endTime, cacheTtl);
            _voteTimeoutScheduler.Schedule(groupSessionId, endTime);
        }

        // Check majority
        var votes = await _cache.GetAllPaymentVotesAsync(groupSessionId);
        var totalMembers = (await _repo.GetSessionWithMembersAsync(groupSessionId))
            ?.Members?.Count(m => m.Status != GroupMemberStatusEnum.Removed) ?? 0;

        var voteCounts = votes.Values.GroupBy(v => v).ToDictionary(g => g.Key, g => g.Count());
        var majority = (totalMembers / 2) + 1;
        var winnerKv = voteCounts.FirstOrDefault(kv => kv.Value >= majority);

        if (winnerKv.Key != 0 && session.VoteStatus == GroupBookingVoteStatusEnum.Voting)
        {
            await ResolveVoteAsync(groupSessionId, (GroupBookingPaymentMethodEnum)winnerKv.Key);
        }

        var state = await BuildVoteState(groupSessionId, userId);
        await _notification.NotifyPaymentMethodVoteUpdateAsync(groupSessionId, state);

        return new BaseResponse<ResPaymentMethodVoteStateDto>
        {
            IsSuccess = true,
            Data = state,
            Message = "Vote recorded"
        };
    }

    public async Task<bool> ResolveTimeoutAsync(Guid groupSessionId)
    {
        var session = await _repo.GetSessionByIdAsync(groupSessionId);
        if (session == null || session.VoteStatus != GroupBookingVoteStatusEnum.Voting)
            return false;

        var votes = await _cache.GetAllPaymentVotesAsync(groupSessionId);
        if (votes.Count == 0)
        {
            return await ResolveVoteAsync(groupSessionId, GroupBookingPaymentMethodEnum.IndividualPay);
        }

        var winner = votes.Values
            .GroupBy(v => v)
            .Select(g => new { Method = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .First();

        return await ResolveVoteAsync(groupSessionId, (GroupBookingPaymentMethodEnum)winner.Method);
    }

    private async Task<bool> ResolveVoteAsync(Guid groupSessionId, GroupBookingPaymentMethodEnum method)
    {
        var session = await _repo.GetSessionByIdAsync(groupSessionId);
        if (session == null || session.VoteStatus == GroupBookingVoteStatusEnum.Completed)
            return false;

        session.PaymentMethod = method;
        session.VoteStatus = GroupBookingVoteStatusEnum.Completed;
        session.Status = method switch
        {
            GroupBookingPaymentMethodEnum.HostPayAll => GroupBookingStatusEnum.PayingAll,
            GroupBookingPaymentMethodEnum.IndividualPay => GroupBookingStatusEnum.PayingIndividual,
            GroupBookingPaymentMethodEnum.PairPay => GroupBookingStatusEnum.Pairing,
            _ => session.Status
        };
        _repo.UpdateSession(session);
        await _unitOfWork.SaveChangesAsync();
        _voteTimeoutScheduler.Cancel(groupSessionId);

        var methodName = method switch
        {
            GroupBookingPaymentMethodEnum.HostPayAll => "Một người trả hộ",
            GroupBookingPaymentMethodEnum.IndividualPay => "Trả riêng lẻ",
            GroupBookingPaymentMethodEnum.PairPay => "Trả theo cặp",
            _ => ""
        };
        await _notification.NotifyGroupChatMessageAsync(groupSessionId, new ResGroupChatMessageDto
        {
            MessageId = Guid.NewGuid(),
            SenderName = "System",
            Content = $"Kết quả vote: {methodName} được chọn",
            MessageType = GroupChatMessageTypeEnum.SystemEvent,
            CreatedAt = DateTime.UtcNow
        });

        var voteState = await BuildVoteState(groupSessionId, Guid.Empty);
        await _notification.NotifyPaymentMethodVoteUpdateAsync(groupSessionId, voteState);
        return true;
    }

    private async Task<ResPaymentMethodVoteStateDto> BuildVoteState(Guid groupSessionId, Guid currentUserId)
    {
        var votes = await _cache.GetAllPaymentVotesAsync(groupSessionId);
        var session = await _repo.GetSessionWithMembersAsync(groupSessionId);
        var totalMembers = session?.Members?.Count(m => m.Status != GroupMemberStatusEnum.Removed) ?? 0;
        var endTime = await _cache.GetVoteEndTimeAsync(groupSessionId);

        var voteCounts = votes.Values.GroupBy(v => v)
            .ToDictionary(g => (GroupBookingPaymentMethodEnum)g.Key, g => g.Count());

        var userVotes = votes.Where(kv => kv.Key == currentUserId)
            .Select(kv => (GroupBookingPaymentMethodEnum)kv.Value).ToList();

        return new ResPaymentMethodVoteStateDto
        {
            VoteStatus = session?.VoteStatus ?? GroupBookingVoteStatusEnum.None,
            ResultMethod = session?.PaymentMethod,
            Votes = votes.Select(kv => new ResPaymentMethodVoteDto
            {
                UserId = kv.Key,
                UserName = "",
                PaymentMethod = (GroupBookingPaymentMethodEnum)kv.Value,
                VotedAt = DateTime.UtcNow
            }).ToList(),
            TotalMembers = totalMembers,
            VotedCount = votes.Count,
            HasVoted = userVotes.Count > 0,
            VoteCounts = voteCounts,
            VoteExpiresAt = endTime
        };
    }
}
