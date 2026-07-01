using System.Text.Json;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class CreatePairUseCase
{
    private readonly IGroupBookingRepository _repo;
    private readonly IUserContextService _userContext;
    private readonly IGroupBookingCacheService _cache;

    public CreatePairUseCase(IGroupBookingRepository repo, IUserContextService userContext, IGroupBookingCacheService cache)
    {
        _repo = repo;
        _userContext = userContext;
        _cache = cache;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid groupSessionId, ReqCreatePairDto request)
    {
        var userId = _userContext.GetUserId();
        var session = await _repo.GetSessionByIdAsync(groupSessionId)
            ?? throw new NotFoundException("Group booking session not found");

        if (session.Status != GroupBookingStatusEnum.Pairing &&
            session.PaymentMethod != GroupBookingPaymentMethodEnum.PairPay)
            throw new BadRequestException("Pairing is not available", "GBK50");

        var requester = await _repo.GetMemberAsync(groupSessionId, userId)
            ?? throw new BadRequestException("You are not a member", "GBK51");
        var target = await _repo.GetMemberByIdAsync(request.TargetMemberId)
            ?? throw new NotFoundException("Target member not found");
        if (target.GroupSessionId != groupSessionId)
            throw new BadRequestException("Target member does not belong to this group", "GBK55");

        if (requester.MemberId == target.MemberId)
            throw new BadRequestException("Cannot pair with yourself", "GBK52");

        if (requester.PairId != null)
            throw new BadRequestException("Already in a pair", "GBK53");
        if (target.PairId != null)
            throw new BadRequestException("Target already in a pair", "GBK54");

        // Save pending request to Redis
        var pairId = Guid.NewGuid().ToString();
        var pairData = JsonSerializer.Serialize(new
        {
            PairId = pairId,
            GroupSessionId = groupSessionId,
            Member1Id = requester.MemberId,
            Member2Id = target.MemberId,
            RequestedByUserId = userId,
            Member1Name = requester.UserInfoEntity?.UserName ?? "",
            Member2Name = target.UserInfoEntity?.UserName ?? ""
        }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        var ttl = GroupBookingCacheTtl.ForPairRequest(session.ExpiresAt);
        await _cache.SetPendingPairRequestAsync(groupSessionId, pairId, pairData, ttl);

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = "Pair request sent"
        };
    }
}
