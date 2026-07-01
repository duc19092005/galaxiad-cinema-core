using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Entities.GroupBooking;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class GetGroupBookingStateUseCase
{
    private readonly IGroupBookingRepository _groupBookingRepository;
    private readonly ISeatLockerNotificationService _notificationService;
    private readonly IGroupBookingCacheService _cache;
    private readonly VotePaymentMethodUseCase _votePaymentMethodUseCase;
    private readonly VotePaymentFailureUseCase _votePaymentFailureUseCase;
    private readonly IVoteTimeoutScheduler _voteTimeoutScheduler;
    private readonly IUnitOfWork _unitOfWork;

    public GetGroupBookingStateUseCase(
        IGroupBookingRepository groupBookingRepository,
        ISeatLockerNotificationService notificationService,
        IGroupBookingCacheService cache,
        VotePaymentMethodUseCase votePaymentMethodUseCase,
        VotePaymentFailureUseCase votePaymentFailureUseCase,
        IVoteTimeoutScheduler voteTimeoutScheduler,
        IUnitOfWork unitOfWork)
    {
        _groupBookingRepository = groupBookingRepository;
        _notificationService = notificationService;
        _cache = cache;
        _votePaymentMethodUseCase = votePaymentMethodUseCase;
        _votePaymentFailureUseCase = votePaymentFailureUseCase;
        _voteTimeoutScheduler = voteTimeoutScheduler;
        _unitOfWork = unitOfWork;
    }

    public async Task<BaseResponse<ResGroupBookingStateDto>> ExecuteAsync(Guid groupSessionId)
    {
        var session = await _groupBookingRepository.GetSessionWithMembersAsync(groupSessionId);
        if (session == null)
            throw new NotFoundException("Group booking session not found");

        DateTime? voteExpiresAt = null;
        if (session.VoteStatus == GroupBookingVoteStatusEnum.Voting)
        {
            voteExpiresAt = await _cache.GetVoteEndTimeAsync(groupSessionId);
            if (voteExpiresAt.HasValue && voteExpiresAt.Value <= DateTime.UtcNow)
            {
                await _votePaymentMethodUseCase.ResolveTimeoutAsync(groupSessionId);
                session = await _groupBookingRepository.GetSessionWithMembersAsync(groupSessionId);
                if (session == null)
                    throw new NotFoundException("Group booking session not found");
                voteExpiresAt = null;
            }
            else if (voteExpiresAt.HasValue)
            {
                _voteTimeoutScheduler.Schedule(groupSessionId, voteExpiresAt.Value);
            }
        }

        if (session.Status == GroupBookingStatusEnum.PaymentFailedPartial)
        {
            var resolutionState = await _cache.GetFailureResolutionStateAsync(groupSessionId);
            if (resolutionState != null && resolutionState.ExpiresAt.HasValue)
            {
                if (resolutionState.ExpiresAt.Value <= DateTime.UtcNow)
                {
                    await _votePaymentFailureUseCase.ResolveFailureTimeoutAsync(groupSessionId);
                    session = await _groupBookingRepository.GetSessionWithMembersAsync(groupSessionId);
                    if (session == null)
                        throw new NotFoundException("Group booking session not found");
                }
                else
                {
                    _voteTimeoutScheduler.Schedule(groupSessionId, resolutionState.ExpiresAt.Value);
                }
            }
        }

        // Tự động hủy phòng khi PaymentDeadlineAt hết hạn
        var payingStatuses = new[] {
            GroupBookingStatusEnum.PayingAll,
            GroupBookingStatusEnum.PayingIndividual,
            GroupBookingStatusEnum.PayingPair,
            GroupBookingStatusEnum.PaymentFailedPartial
        };
        var autoCancelled = false;
        if (payingStatuses.Contains(session.Status) &&
            session.PaymentDeadlineAt.HasValue &&
            session.PaymentDeadlineAt.Value <= DateTime.UtcNow)
        {
            session.Status = GroupBookingStatusEnum.Cancelled;
            _groupBookingRepository.UpdateSession(session);
            await _unitOfWork.SaveChangesAsync();

            await _notificationService.NotifyGroupChatMessageAsync(session.GroupSessionId, new ResGroupChatMessageDto
            {
                MessageId = Guid.NewGuid(),
                SenderName = "System",
                Content = "Hết thời gian thanh toán. Phòng đã bị hủy.",
                MessageType = GroupChatMessageTypeEnum.PaymentEvent,
                CreatedAt = DateTime.UtcNow
            });

            autoCancelled = true;
            session = await _groupBookingRepository.GetSessionWithMembersAsync(groupSessionId);
            if (session == null)
                throw new NotFoundException("Group booking session not found");
        }

        var activeSelections = _notificationService.GetGroupSelectionsForSchedule(session.MovieScheduleId.ToString());
        var groupSelections = activeSelections
            .Where(s => s.Value.GroupSessionId == session.GroupSessionId)
            .ToList();

        var seatIds = groupSelections.Select(s => Guid.Parse(s.Key)).ToList();
        var seatsInfo = new List<SeatsInfoEntity>();
        if (seatIds.Any())
        {
            seatsInfo = await _groupBookingRepository.GetValidSeatsAsync(
                session.MovieScheduleInfoEntity?.AuditoriumId ?? Guid.Empty, seatIds);
        }

        var allSeats = groupSelections.Select(s =>
        {
            var seatIdGuid = Guid.Parse(s.Key);
            var seatInfo = seatsInfo.FirstOrDefault(x => x.SeatId == seatIdGuid);
            return new GroupSeatDto
            {
                SeatId = seatIdGuid,
                SeatNumber = seatInfo?.SeatNumber ?? string.Empty,
                ColIndex = seatInfo?.ColIndex ?? 0,
                RowIndex = seatInfo?.RowIndex ?? 0,
                PriceEach = 0,
                IsConfirmed = false,
                MemberId = s.Value.MemberId,
                MemberName = s.Value.MemberName
            };
        }).ToList();

        // Get pairs from Redis
        var pairTuples = await _cache.GetAcceptedPairsAsync(groupSessionId);
        var activeMembers = session.Members?
            .Where(m => m.Status != GroupMemberStatusEnum.Removed)
            .ToList() ?? [];
        var pairedMemberIds = pairTuples
            .SelectMany(p => new[] { p.Member1Id, p.Member2Id })
            .ToHashSet();

        var pairDtos = pairTuples.Select(p =>
        {
            var m1 = activeMembers.FirstOrDefault(m => m.MemberId == p.Member1Id);
            var m2 = activeMembers.FirstOrDefault(m => m.MemberId == p.Member2Id);
            return new ResGroupPairDto
            {
                PairId = Guid.NewGuid(),
                Member1 = MapMember(m1, allSeats),
                Member2 = MapMember(m2, allSeats),
                Status = GroupPairRequestStatusEnum.Accepted,
                TotalAmount = (m1?.AmountToPay ?? 0) + (m2?.AmountToPay ?? 0),
                SeatCount = (m1?.SelectedSeats?.Count ?? 0) + (m2?.SelectedSeats?.Count ?? 0)
            };
        }).ToList();

        pairDtos.AddRange(activeMembers
            .Where(m => !pairedMemberIds.Contains(m.MemberId))
            .Select(m => new ResGroupPairDto
            {
                PairId = Guid.Empty,
                Member1 = MapMember(m, allSeats),
                Status = GroupPairRequestStatusEnum.Accepted,
                TotalAmount = m.AmountToPay,
                SeatCount = m.SelectedSeats?.Count ?? 0
            }));

        var stateDto = new ResGroupBookingStateDto
        {
            GroupSessionId = session.GroupSessionId,
            ScheduleId = session.MovieScheduleId,
            GroupCode = session.GroupCode,
            GroupName = session.GroupName ?? string.Empty,
            Status = session.Status,
            MovieName = session.MovieScheduleInfoEntity?.MovieInfoEntity?.MovieName ?? string.Empty,
            MovieImageUrl = session.MovieScheduleInfoEntity?.MovieInfoEntity?.MovieImageUrl ?? string.Empty,
            CinemaName = session.MovieScheduleInfoEntity?.AuditoriumInfoEntities?.CinemaInfoEntity?.CinemaName ?? string.Empty,
            AuditoriumNumber = session.MovieScheduleInfoEntity?.AuditoriumInfoEntities?.AuditoriumNumber ?? string.Empty,
            FormatName = session.MovieScheduleInfoEntity?.MovieFormatInfoEntity?.MovieFormatName ?? string.Empty,
            StartTime = session.MovieScheduleInfoEntity?.StartTime ?? DateTime.MinValue,
            EndedTime = session.MovieScheduleInfoEntity?.EndedTime ?? DateTime.MinValue,
            MaxMembers = session.MaxMembers,
            PaymentDeadlineAt = session.PaymentDeadlineAt,
            TotalGroupAmount = session.TotalGroupAmount,
            CollectedAmount = session.CollectedAmount,
            PaymentMethod = session.PaymentMethod,
            VoteStatus = session.VoteStatus,
            VoteExpiresAt = voteExpiresAt,
            Members = activeMembers
                .Select(m => new GroupMemberDto
                {
                    MemberId = m.MemberId,
                    UserId = m.UserId,
                    UserName = m.UserInfoEntity?.UserName ?? string.Empty,
                    AvatarUrl = m.UserInfoEntity?.PortraitImageUrl,
                    IsHost = m.IsHost,
                    Status = m.Status,
                    AmountToPay = m.AmountToPay,
                    AmountPaid = m.AmountPaid,
                    PairId = m.PairId,
                    SelectedSeats = MapSelectedSeats(m, allSeats)
                }).ToList(),
            AllGroupSeats = allSeats,
            Pairs = pairDtos
        };

        // Tự động build FailureVoteState khi có thanh toán thất bại
        // Để frontend hiển thị modal vote 3 options ngay khi load trang
        if (session.Status == GroupBookingStatusEnum.PaymentFailedPartial)
        {
            var resolutionState = await _cache.GetFailureResolutionStateAsync(session.GroupSessionId);
            if (resolutionState != null)
            {
                stateDto.FailureVoteState = resolutionState;
            }
            else
            {
                var failedMember = session.Members
                    .FirstOrDefault(m => m.Status == GroupMemberStatusEnum.PaymentFailed);
                if (failedMember != null)
                {
                    stateDto.FailureVoteState = new ResPaymentFailureVoteStateDto
                    {
                        FailedMemberId = failedMember.MemberId,
                        FailedMemberName = failedMember.UserInfoEntity?.UserName ?? "Unknown",
                        FailedAmount = failedMember.AmountToPay,
                        TotalMembers = session.Members.Count(m => m.Status != GroupMemberStatusEnum.Removed),
                        Phase = "Selection"
                    };
                }
            }
        }
        else if (session.Status == GroupBookingStatusEnum.PaymentFailed)
        {
            var failedMember = session.Members
                .FirstOrDefault(m => m.Status == GroupMemberStatusEnum.PaymentFailed);
            if (failedMember != null)
            {
                stateDto.FailureVoteState = new ResPaymentFailureVoteStateDto
                {
                    FailedMemberId = failedMember.MemberId,
                    FailedMemberName = failedMember.UserInfoEntity?.UserName ?? "Unknown",
                    FailedAmount = failedMember.AmountToPay,
                    TotalMembers = session.Members.Count(m => m.Status != GroupMemberStatusEnum.Removed),
                    Phase = "Completed",
                    ResolutionAction = "CancelOrder"
                };
            }
        }

        // Nếu auto-cancel vừa xảy ra, broadcast state mới cho tất cả WebSocket clients
        if (autoCancelled)
        {
            await _notificationService.NotifyGroupUpdateAsync(groupSessionId, stateDto);
        }

        return new BaseResponse<ResGroupBookingStateDto>
        {
            IsSuccess = true,
            Data = stateDto,
            Message = "Group state retrieved"
        };
    }

    private static GroupMemberDto MapMember(GroupBookingMemberEntity? m, List<GroupSeatDto> allSeats) => m == null ? new GroupMemberDto() : new()
    {
        MemberId = m.MemberId,
        UserId = m.UserId,
        UserName = m.UserInfoEntity?.UserName ?? "",
        AvatarUrl = m.UserInfoEntity?.PortraitImageUrl,
        IsHost = m.IsHost,
        Status = m.Status,
        AmountToPay = m.AmountToPay,
        AmountPaid = m.AmountPaid,
        PairId = m.PairId,
        SelectedSeats = MapSelectedSeats(m, allSeats)
    };

    private static List<GroupSeatDto> MapSelectedSeats(GroupBookingMemberEntity m, List<GroupSeatDto> allSeats)
    {
        var liveSeats = allSeats.Where(s => s.MemberId == m.MemberId).ToList();
        if (liveSeats.Count > 0)
            return liveSeats;

        return m.SelectedSeats?.Select(s => new GroupSeatDto
        {
            SeatId = s.SeatId,
            SeatNumber = s.SeatsInfoEntity?.SeatNumber ?? string.Empty,
            ColIndex = s.SeatsInfoEntity?.ColIndex ?? 0,
            RowIndex = s.SeatsInfoEntity?.RowIndex ?? 0,
            PriceEach = s.PriceEach,
            IsConfirmed = s.IsConfirmed,
            MemberId = m.MemberId,
            MemberName = m.UserInfoEntity?.UserName
        }).ToList() ?? [];
    }
}
