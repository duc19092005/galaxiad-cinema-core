using System.Text.Json;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class RespondPairUseCase
{
    private readonly IGroupBookingRepository _repo;
    private readonly IUserContextService _userContext;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISeatLockerNotificationService _notification;
    private readonly IGroupBookingCacheService _cache;

    public RespondPairUseCase(
        IGroupBookingRepository repo,
        IUserContextService userContext,
        IUnitOfWork unitOfWork,
        ISeatLockerNotificationService notification,
        IGroupBookingCacheService cache)
    {
        _repo = repo;
        _userContext = userContext;
        _unitOfWork = unitOfWork;
        _notification = notification;
        _cache = cache;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid groupSessionId, string pairId, ReqRespondPairDto request)
    {
        var userId = _userContext.GetUserId();

        var pairJson = await _cache.GetPendingPairRequestAsync(groupSessionId, pairId)
            ?? throw new NotFoundException("Pair request not found or expired");

        var pairData = JsonSerializer.Deserialize<JsonElement>(pairJson);
        var storedGroupSessionId = Guid.Parse(pairData.GetProperty("groupSessionId").GetString()!);
        var member1Id = Guid.Parse(pairData.GetProperty("member1Id").GetString()!);
        var member2Id = Guid.Parse(pairData.GetProperty("member2Id").GetString()!);
        if (storedGroupSessionId != groupSessionId)
            throw new BadRequestException("Pair request does not belong to this group", "GBK59");

        var respondingMember = await _repo.GetMemberAsync(groupSessionId, userId)
            ?? throw new BadRequestException("You are not a member", "GBK57");

        if (respondingMember.MemberId != member2Id)
            throw new BadRequestException("Only the invited member can respond", "GBK58");

        await _cache.DeletePendingPairRequestAsync(groupSessionId, pairId);

        if (request.Accept)
        {
            var session = await _repo.GetSessionByIdAsync(groupSessionId)
                ?? throw new NotFoundException("Group booking session not found");
            var ttl = GroupBookingCacheTtl.ForGroup(session.ExpiresAt);
            await _cache.SetAcceptedPairAsync(groupSessionId, member1Id, member2Id, ttl);

            var m1 = await _repo.GetMemberByIdAsync(member1Id);
            var m2 = await _repo.GetMemberByIdAsync(member2Id);
            if (m1 != null) { m1.PairId = Guid.Parse(pairId); _repo.UpdateMember(m1); }
            if (m2 != null) { m2.PairId = Guid.Parse(pairId); _repo.UpdateMember(m2); }
            await _unitOfWork.SaveChangesAsync();

            await _notification.NotifyGroupChatMessageAsync(groupSessionId, new ResGroupChatMessageDto
            {
                MessageId = Guid.NewGuid(),
                SenderName = "System",
                Content = $"{m1?.UserInfoEntity?.UserName} và {m2?.UserInfoEntity?.UserName} đã ghép đôi!",
                MessageType = GroupChatMessageTypeEnum.SystemEvent,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            await _notification.NotifyGroupChatMessageAsync(groupSessionId, new ResGroupChatMessageDto
            {
                MessageId = Guid.NewGuid(),
                SenderName = "System",
                Content = $"{respondingMember.UserInfoEntity?.UserName} từ chối ghép đôi.",
                MessageType = GroupChatMessageTypeEnum.SystemEvent,
                CreatedAt = DateTime.UtcNow
            });
        }

        return new BaseResponse<bool> { IsSuccess = true, Data = request.Accept };
    }
}
