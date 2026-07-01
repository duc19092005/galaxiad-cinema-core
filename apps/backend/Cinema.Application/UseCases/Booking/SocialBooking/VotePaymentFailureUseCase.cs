using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Entities.GroupBooking;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class VotePaymentFailureUseCase
{
    private readonly IGroupBookingRepository _repo;
    private readonly IUserContextService _userContext;
    private readonly ISeatLockerNotificationService _notification;
    private readonly IGroupBookingCacheService _cache;
    private readonly IUnitOfWork _unitOfWork;

    public VotePaymentFailureUseCase(
        IGroupBookingRepository repo, IUserContextService userContext,
        ISeatLockerNotificationService notification, IGroupBookingCacheService cache,
        IUnitOfWork unitOfWork)
    {
        _repo = repo; _userContext = userContext;
        _notification = notification; _cache = cache;
        _unitOfWork = unitOfWork;
    }

    public async Task<BaseResponse<ResPaymentFailureVoteStateDto>> ExecuteAsync(
        Guid groupSessionId, ReqVotePaymentFailureDto request)
    {
        var userId = _userContext.GetUserId();
        var session = await _repo.GetSessionByIdAsync(groupSessionId)
            ?? throw new NotFoundException("Session not found");

        if (session.Status != GroupBookingStatusEnum.PaymentFailed &&
            session.Status != GroupBookingStatusEnum.PaymentFailedPartial)
            throw new BadRequestException("No payment failure to vote on", "GBK60");

        var ttl = GroupBookingCacheTtl.ForGroup(session.ExpiresAt);
        await _cache.SetFailureVoteAsync(groupSessionId, request.FailedMemberId, userId, (int)request.Action, ttl);

        var state = await BuildState(groupSessionId, request.FailedMemberId, userId);
        return new BaseResponse<ResPaymentFailureVoteStateDto> { IsSuccess = true, Data = state, Message = "Vote recorded" };
    }

    public async Task<ResPaymentFailureVoteStateDto> BuildState(Guid groupSessionId, Guid failedMemberId, Guid currentUserId)
    {
        var resolutionState = await _cache.GetFailureResolutionStateAsync(groupSessionId);
        if (resolutionState != null)
        {
            await _notification.NotifyPaymentFailureVoteUpdateAsync(groupSessionId, resolutionState);
            return resolutionState;
        }

        var votes = await _cache.GetFailureVotesAsync(groupSessionId, failedMemberId);
        var raiseHands = await _cache.GetRaiseHandsAsync(groupSessionId, failedMemberId);
        var session = await _repo.GetSessionWithMembersAsync(groupSessionId);
        var totalMembers = session?.Members.Count(m => m.Status != GroupMemberStatusEnum.Removed) ?? 0;
        var failedMember = session?.Members.FirstOrDefault(m => m.MemberId == failedMemberId);

        var majority = (totalMembers / 2) + 1;
        var actionCounts = votes.Values.GroupBy(v => v).ToDictionary(g => (GroupPaymentFailureVoteActionEnum)g.Key, g => g.Count());
        var resultAction = actionCounts.FirstOrDefault(kv => kv.Value >= majority).Key;

        var userNameCache = session?.Members.ToDictionary(m => m.UserId, m => m.UserInfoEntity?.UserName ?? "") ?? new();
        var handUsers = raiseHands.Select(uid => userNameCache.TryGetValue(uid, out var n) ? n : "Unknown").ToList();

        var state = new ResPaymentFailureVoteStateDto
        {
            FailedMemberId = failedMemberId,
            FailedMemberName = failedMember?.UserInfoEntity?.UserName ?? "Unknown",
            FailedAmount = failedMember?.AmountToPay ?? 0,
            Votes = votes.Select(kv => new ResPaymentFailureVoteDto
            {
                VoterUserId = kv.Key, Action = (GroupPaymentFailureVoteActionEnum)kv.Value, VotedAt = DateTime.UtcNow
            }).ToList(),
            RaiseHands = raiseHands.Select(uid => new ResPaymentFailureVoteDto
            {
                VoterUserId = uid,
                VoterUserName = userNameCache.TryGetValue(uid, out var n) ? n : "Unknown",
                Action = GroupPaymentFailureVoteActionEnum.VolunteerToPay,
                IsRaiseHand = true, VotedAt = DateTime.UtcNow
            }).ToList(),
            TotalMembers = totalMembers,
            VotedCount = votes.Count,
            ResultAction = resultAction != default ? resultAction : null,
            VolunteerWinnerName = raiseHands.Count > 0
                ? (userNameCache.TryGetValue(raiseHands.First(), out var wn) ? wn : "Unknown") : null
        };

        await _notification.NotifyPaymentFailureVoteUpdateAsync(groupSessionId, state);
        return state;
    }

    public async Task<BaseResponse<ResPaymentFailureVoteStateDto>> VoteFailureOptionAsync(
        Guid groupSessionId, ReqVoteFailureOptionDto request)
    {
        var userId = _userContext.GetUserId();
        var session = await _repo.GetSessionWithMembersAsync(groupSessionId)
            ?? throw new NotFoundException("Session not found");

        if (session.Status != GroupBookingStatusEnum.PaymentFailedPartial)
            throw new BadRequestException("Group is not in payment failure voting state", "GBK60");

        var resolutionState = await _cache.GetFailureResolutionStateAsync(groupSessionId)
            ?? throw new BadRequestException("No active failure vote resolution state found", "GBK61");

        if (resolutionState.Phase != "Discussion")
            throw new BadRequestException("Voting on options is only allowed during discussion phase", "GBK62");

        var isSuccessfulMember = session.Members.Any(m => m.UserId == userId && m.Status == GroupMemberStatusEnum.Paid);
        if (!isSuccessfulMember)
            throw new BadRequestException("Only successful payers can vote on resolution options", "GBK63");

        var user = session.Members.First(m => m.UserId == userId);

        var existingVote = resolutionState.OptionVotes.FirstOrDefault(v => v.VoterUserId == userId);
        if (existingVote != null)
        {
            existingVote.Option = request.Option;
        }
        else
        {
            resolutionState.OptionVotes.Add(new GroupFailureOptionVoteDto
            {
                VoterUserId = userId,
                VoterUserName = user.UserInfoEntity?.UserName ?? "Unknown",
                Option = request.Option
            });
        }

        var successfulMembers = session.Members.Where(m => m.Status == GroupMemberStatusEnum.Paid).ToList();
        var totalVotesRequired = successfulMembers.Count;

        if (resolutionState.OptionVotes.Count >= totalVotesRequired)
        {
            await _cache.SetFailureResolutionStateAsync(groupSessionId, resolutionState, GroupBookingCacheTtl.ForGroup(session.ExpiresAt));
            await ResolveFailureTimeoutAsync(groupSessionId);
            var updatedState = await _cache.GetFailureResolutionStateAsync(groupSessionId);
            return new BaseResponse<ResPaymentFailureVoteStateDto>
            {
                IsSuccess = true,
                Data = updatedState,
                Message = "Vote recorded and resolution applied"
            };
        }

        await _cache.SetFailureResolutionStateAsync(groupSessionId, resolutionState, GroupBookingCacheTtl.ForGroup(session.ExpiresAt));
        await _notification.NotifyPaymentFailureVoteUpdateAsync(groupSessionId, resolutionState);

        return new BaseResponse<ResPaymentFailureVoteStateDto>
        {
            IsSuccess = true,
            Data = resolutionState,
            Message = "Vote recorded"
        };
    }

    public async Task<bool> ResolveFailureTimeoutAsync(Guid groupSessionId)
    {
        var session = await _repo.GetSessionWithMembersAsync(groupSessionId);
        if (session == null || session.Status != GroupBookingStatusEnum.PaymentFailedPartial)
            return false;

        var resolutionState = await _cache.GetFailureResolutionStateAsync(groupSessionId);
        if (resolutionState == null)
            return false;

        var ttl = GroupBookingCacheTtl.ForGroup(session.ExpiresAt);

        if (resolutionState.Phase == "Selection")
        {
            var unsponsoredMembers = new List<FailedMemberVolunteersDto>();
            foreach (var fm in resolutionState.FailedMembers)
            {
                if (fm.Volunteers.Count >= 2)
                {
                    var winner = fm.Volunteers.First();
                    fm.Volunteers = new List<VolunteerDto> { winner };
                }

                if (fm.Volunteers.Count == 0)
                {
                    unsponsoredMembers.Add(fm);
                }
            }

            if (unsponsoredMembers.Any())
            {
                resolutionState.Phase = "Discussion";
                resolutionState.ExpiresAt = DateTime.UtcNow.AddSeconds(60);
                resolutionState.OptionVotes = new List<GroupFailureOptionVoteDto>();
                session.PaymentDeadlineAt = resolutionState.ExpiresAt;
                _repo.UpdateSession(session);
                await _unitOfWork.SaveChangesAsync();

                await _cache.SetFailureResolutionStateAsync(groupSessionId, resolutionState, ttl);

                await _notification.NotifyGroupChatMessageAsync(groupSessionId, new ResGroupChatMessageDto
                {
                    MessageId = Guid.NewGuid(),
                    SenderName = "System",
                    Content = $"Vẫn còn {unsponsoredMembers.Count} thành viên chưa có người trả hộ. Bắt đầu đếm ngược 60 giây thảo luận 3 phương án.",
                    MessageType = GroupChatMessageTypeEnum.PaymentEvent,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                resolutionState.Phase = "Completed";
                resolutionState.ExpiresAt = null;
                session.PaymentDeadlineAt = DateTime.UtcNow.AddMinutes(5);
                _repo.UpdateSession(session);
                await _unitOfWork.SaveChangesAsync();

                await _cache.SetFailureResolutionStateAsync(groupSessionId, resolutionState, ttl);

                foreach (var fm in resolutionState.FailedMembers)
                {
                    var sponsor = fm.Volunteers.First();
                    await _notification.NotifyGroupChatMessageAsync(groupSessionId, new ResGroupChatMessageDto
                    {
                        MessageId = Guid.NewGuid(),
                        SenderName = "System",
                        Content = $"{sponsor.UserName} đã đăng ký trả hộ cho {fm.FailedMemberName}.",
                        MessageType = GroupChatMessageTypeEnum.PaymentEvent,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
        }
        else if (resolutionState.Phase == "Discussion")
        {
            var successfulMembers = session.Members.Where(m => m.Status == GroupMemberStatusEnum.Paid).ToList();
            var totalVoters = successfulMembers.Count;

            var votesGroup = resolutionState.OptionVotes
                .GroupBy(v => v.Option)
                .ToDictionary(g => g.Key, g => g.Count());

            // Default to Option 2 (Cancel & Refund) if tie or no votes, as requested by the user
            var winningOption = 2;
            if (votesGroup.Any())
            {
                var maxVotes = votesGroup.Values.Max();
                var topOptions = votesGroup.Where(kv => kv.Value == maxVotes).Select(kv => kv.Key).ToList();
                if (topOptions.Count == 1)
                {
                    winningOption = topOptions.First();
                }
                else
                {
                    winningOption = 2;
                }
            }

            if (winningOption == 1)
            {
                resolutionState.Phase = "Selection";
                resolutionState.ExpiresAt = DateTime.UtcNow.AddSeconds(30);
                session.PaymentDeadlineAt = resolutionState.ExpiresAt;
                _repo.UpdateSession(session);
                await _unitOfWork.SaveChangesAsync();

                await _cache.SetFailureResolutionStateAsync(groupSessionId, resolutionState, ttl);

                await _notification.NotifyGroupChatMessageAsync(groupSessionId, new ResGroupChatMessageDto
                {
                    MessageId = Guid.NewGuid(),
                    SenderName = "System",
                    Content = "Nhóm chọn phương án tiếp tục chọn người trả hộ. Có thêm 30 giây để đăng ký.",
                    MessageType = GroupChatMessageTypeEnum.PaymentEvent,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else if (winningOption == 2)
            {
                resolutionState.Phase = "Completed";
                resolutionState.ResolutionAction = "CancelOrder";
                await _cache.SetFailureResolutionStateAsync(groupSessionId, resolutionState, ttl);

                session.Status = GroupBookingStatusEnum.Cancelled;
                session.CollectedAmount = 0;
                _repo.UpdateSession(session);

                var paidMembers = session.Members.Where(m => m.Status == GroupMemberStatusEnum.Paid).ToList();
                foreach (var member in paidMembers)
                {
                    member.AmountPaid = 0;
                    member.Status = GroupMemberStatusEnum.Removed;
                    _repo.UpdateMember(member);
                }

                foreach (var seat in session.Members.SelectMany(m => m.SelectedSeats))
                {
                    seat.IsConfirmed = false;
                }

                await _unitOfWork.SaveChangesAsync();

                await _notification.NotifyGroupChatMessageAsync(groupSessionId, new ResGroupChatMessageDto
                {
                    MessageId = Guid.NewGuid(),
                    SenderName = "System",
                    Content = "Cả nhóm thống nhất Hủy vé và Hoàn tiền. Phòng đặt đã bị hủy.",
                    MessageType = GroupChatMessageTypeEnum.PaymentEvent,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else if (winningOption == 3)
            {
                resolutionState.Phase = "Completed";
                resolutionState.ResolutionAction = "ProceedWithoutUnsponsored";

                var unsponsoredIds = resolutionState.FailedMembers
                    .Where(fm => fm.Volunteers.Count == 0)
                    .Select(fm => fm.FailedMemberId)
                    .ToHashSet();

                foreach (var member in session.Members)
                {
                    if (unsponsoredIds.Contains(member.MemberId))
                    {
                        member.Status = GroupMemberStatusEnum.Removed;
                        foreach (var seat in member.SelectedSeats)
                        {
                            seat.IsConfirmed = false;
                        }
                        _repo.UpdateMember(member);
                    }
                }

                var remainingActive = session.Members.Where(m => m.Status != GroupMemberStatusEnum.Removed).ToList();
                var allPaid = remainingActive.All(m => m.Status == GroupMemberStatusEnum.Paid);

                if (allPaid)
                {
                    session.Status = GroupBookingStatusEnum.Completed;
                    _repo.UpdateSession(session);
                    await _unitOfWork.SaveChangesAsync();

                    await _notification.NotifyGroupChatMessageAsync(groupSessionId, new ResGroupChatMessageDto
                    {
                        MessageId = Guid.NewGuid(),
                        SenderName = "System",
                        Content = "Nhóm thống nhất bỏ các thành viên lẻ không thanh toán. Giao dịch hoàn tất!",
                        MessageType = GroupChatMessageTypeEnum.PaymentEvent,
                        CreatedAt = DateTime.UtcNow
                    });

                    _notification.ClearGroupSelections(session.MovieScheduleId.ToString(), session.GroupSessionId);
                    await _cache.ClearAllGroupDataAsync(groupSessionId);
                }
                else
                {
                    session.PaymentDeadlineAt = DateTime.UtcNow.AddMinutes(5);
                    _repo.UpdateSession(session);
                    await _unitOfWork.SaveChangesAsync();

                    await _cache.SetFailureResolutionStateAsync(groupSessionId, resolutionState, ttl);

                    await _notification.NotifyGroupChatMessageAsync(groupSessionId, new ResGroupChatMessageDto
                    {
                        MessageId = Guid.NewGuid(),
                        SenderName = "System",
                        Content = "Nhóm thống nhất bỏ các thành viên lẻ. Những người đăng ký trả hộ vui lòng hoàn tất thanh toán nốt.",
                        MessageType = GroupChatMessageTypeEnum.PaymentEvent,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
        }

        await _notification.NotifyPaymentFailureVoteUpdateAsync(groupSessionId, resolutionState);
        return true;
    }
}
