using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class RaiseHandUseCase
{
    private readonly IGroupBookingRepository _repo;
    private readonly IUserContextService _userContext;
    private readonly ISeatLockerNotificationService _notification;
    private readonly IGroupBookingCacheService _cache;

    public RaiseHandUseCase(
        IGroupBookingRepository repo, IUserContextService userContext,
        ISeatLockerNotificationService notification, IGroupBookingCacheService cache)
    {
        _repo = repo; _userContext = userContext;
        _notification = notification; _cache = cache;
    }

    public async Task<BaseResponse<ResPaymentFailureVoteStateDto>> ExecuteAsync(
        Guid groupSessionId, ReqRaiseHandDto request)
    {
        var userId = _userContext.GetUserId();
        var session = await _repo.GetSessionWithMembersAsync(groupSessionId)
            ?? throw new NotFoundException("Session not found");

        if (session.Status != GroupBookingStatusEnum.PaymentFailedPartial)
            throw new BadRequestException("Group is not in payment failure voting state", "GBK62");

        var resolutionState = await _cache.GetFailureResolutionStateAsync(groupSessionId)
            ?? throw new BadRequestException("No active failure resolution state found", "GBK63");

        if (resolutionState.Phase != "Selection")
            throw new BadRequestException("Registering to pay is only allowed during selection phase", "GBK64");

        var isSuccessfulMember = session.Members.Any(m => m.UserId == userId && m.Status == GroupMemberStatusEnum.Paid);
        if (!isSuccessfulMember)
            throw new BadRequestException("Only successful payers can register to pay for others", "GBK65");

        var voter = session.Members.First(m => m.UserId == userId);

        var targetFailedMember = resolutionState.FailedMembers.FirstOrDefault(fm => fm.FailedMemberId == request.FailedMemberId);
        if (targetFailedMember == null)
            throw new BadRequestException("Target member has not failed payment", "GBK66");

        if (request.IsRaiseHand)
        {
            if (!targetFailedMember.Volunteers.Any(v => v.UserId == userId))
            {
                targetFailedMember.Volunteers.Add(new VolunteerDto
                {
                    UserId = userId,
                    UserName = voter.UserInfoEntity?.UserName ?? "Unknown"
                });
            }
        }
        else
        {
            targetFailedMember.Volunteers.RemoveAll(v => v.UserId == userId);
        }

        await _cache.SetFailureResolutionStateAsync(groupSessionId, resolutionState, GroupBookingCacheTtl.ForGroup(session.ExpiresAt));

        return new BaseResponse<ResPaymentFailureVoteStateDto>
        {
            IsSuccess = true,
            Data = resolutionState,
            Message = request.IsRaiseHand ? "Registered as volunteer" : "Cancelled volunteer registration"
        };
    }
}
