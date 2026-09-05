using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.UseCases.Booking.BookingFlow;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class SelectGroupSeatsUseCase
{
    private readonly IGroupBookingRepository _groupBookingRepository;
    private readonly IUserContextService _userContextService;
    private readonly ILogger<SelectGroupSeatsUseCase> _logger;
    private readonly ISeatLockerNotificationService _notificationService;
    private readonly GetGroupBookingStateUseCase _getGroupBookingStateUseCase;

    public SelectGroupSeatsUseCase(
        IGroupBookingRepository groupBookingRepository,
        IUserContextService userContextService,
        ILogger<SelectGroupSeatsUseCase> logger,
        ISeatLockerNotificationService notificationService,
        GetGroupBookingStateUseCase getGroupBookingStateUseCase)
    {
        _groupBookingRepository = groupBookingRepository;
        _userContextService = userContextService;
        _logger = logger;
        _notificationService = notificationService;
        _getGroupBookingStateUseCase = getGroupBookingStateUseCase;
    }

    public async Task<BaseResponse<ResGroupBookingStateDto>> ExecuteAsync(Guid groupSessionId, ReqSelectGroupSeatsDto request)
    {
        var userId = _userContextService.GetUserId();

        var session = await _groupBookingRepository.GetSessionWithMembersAsync(groupSessionId);
        if (session == null)
            throw new NotFoundException("Group booking session not found");

        var member = session.Members.FirstOrDefault(m => m.UserId == userId && m.Status != GroupMemberStatusEnum.Removed);
        if (member == null)
            throw new BadRequestException("You are not a member of this group", "GBK21");

        if (session.Status != GroupBookingStatusEnum.Open && session.Status != GroupBookingStatusEnum.SeatsSelected)
            throw new BadRequestException("Cannot select seats in current session status", "GBK22");

        var seatSelections = (request?.SeatSelections ?? [])
            .GroupBy(s => s.SeatId)
            .Select(g => g.First())
            .ToList();
        var seatIds = seatSelections.Select(s => s.SeatId).ToList();
        var validSeats = seatIds.Count == 0
            ? []
            : await _groupBookingRepository.GetValidSeatsAsync(
                session.MovieScheduleInfoEntity?.AuditoriumId ?? Guid.Empty, seatIds);

        if (validSeats.Count != seatIds.Count)
            throw new BadRequestException("One or more selected seats are invalid", "GBK23");

        var scheduleIdStr = session.MovieScheduleId.ToString();

        var activeSelections = await _notificationService.GetGroupSelectionsForScheduleAsync(scheduleIdStr);
        foreach (var seatId in seatIds)
        {
            var seatIdStr = seatId.ToString().ToLower();
            if (activeSelections.TryGetValue(seatIdStr, out var sel))
            {
                if (sel.GroupSessionId != session.GroupSessionId)
                    throw new BadRequestException("Seat is already occupied by another user", "GBK24");
                else if (sel.MemberId != member.MemberId)
                    throw new BadRequestException("Seat already selected by another member in your group", "GBK25");
            }
        }

        if (seatIds.Count > 0)
        {
            var auditoriumId = session.MovieScheduleInfoEntity?.AuditoriumId ?? Guid.Empty;
            var auditoriumSeats = await _groupBookingRepository.GetAuditoriumSeatsAsync(auditoriumId);
            var occupiedOutsideGroup = await _groupBookingRepository.GetOccupiedSeatIdsAsync(
                session.MovieScheduleId,
                session.GroupSessionId);

            var otherMemberSeatIds = activeSelections
                .Where(s => s.Value.GroupSessionId == session.GroupSessionId
                            && s.Value.MemberId != member.MemberId
                            && Guid.TryParse(s.Key, out _))
                .Select(s => Guid.Parse(s.Key))
                .ToList();

            var seatSelectionErrors = BookingSeatSelectionPolicy.ValidateSeatSelection(
                auditoriumSeats,
                seatIds,
                occupiedOutsideGroup.Concat(otherMemberSeatIds),
                requireContiguousSelection: false); // Intermediate choices; enforce on confirmation.

            if (seatSelectionErrors.Count > 0)
                throw new BadRequestException(seatSelectionErrors, "GBK36");
        }

        // Calculate changes in selections for detailed chat notification
        var existingSeats = activeSelections
            .Where(s => s.Value.MemberId == member.MemberId)
            .Select(s => s.Key.ToLower())
            .ToList();

        var lowercaseReqSeats = seatIds.Select(id => id.ToString().ToLower()).ToList();
        var releasedSeatIds = existingSeats.Except(lowercaseReqSeats).ToList();
        var newlySelectedSeatIds = lowercaseReqSeats.Except(existingSeats).ToList();

        var allQueryIds = seatIds.Concat(releasedSeatIds.Select(Guid.Parse)).Distinct().ToList();
        var allSeatsInfo = await _groupBookingRepository.GetValidSeatsAsync(
            session.MovieScheduleInfoEntity?.AuditoriumId ?? Guid.Empty, allQueryIds);

        var newlySelectedSeatNames = allSeatsInfo
            .Where(s => newlySelectedSeatIds.Contains(s.SeatId.ToString().ToLower()))
            .Select(s => s.SeatNumber)
            .ToList();

        var releasedSeatNames = allSeatsInfo
            .Where(s => releasedSeatIds.Contains(s.SeatId.ToString().ToLower()))
            .Select(s => s.SeatNumber)
            .ToList();

        var user = await _groupBookingRepository.FindUserByIdAsync(userId);
        var userName = user?.UserName ?? "Group Member";
        var roleLabel = member.IsHost ? "[Chủ phòng]" : "[Thành viên]";

        string contentText;
        if (newlySelectedSeatNames.Any() && releasedSeatNames.Any())
        {
            contentText = $"{roleLabel} {userName} đã đổi ghế từ {string.Join(", ", releasedSeatNames)} sang {string.Join(", ", newlySelectedSeatNames)}";
        }
        else if (newlySelectedSeatNames.Any())
        {
            contentText = $"{roleLabel} {userName} đã chọn {newlySelectedSeatNames.Count} ghế: {string.Join(", ", newlySelectedSeatNames)}";
        }
        else if (releasedSeatNames.Any())
        {
            contentText = $"{roleLabel} {userName} đã hủy chọn {releasedSeatNames.Count} ghế: {string.Join(", ", releasedSeatNames)}";
        }
        else
        {
            contentText = $"{roleLabel} {userName} đã thay đổi lựa chọn ghế";
        }

        try
        {
            await _notificationService.UpdateGroupMemberSelectionAsync(
                scheduleIdStr,
                session.GroupSessionId,
                member.MemberId,
                userName,
                seatSelections,
                GroupBookingCacheTtl.ForGroup(session.ExpiresAt));
        }
        catch (InvalidOperationException ex)
        {
            throw new BadRequestException(ex.Message, "GBK26");
        }

        if (newlySelectedSeatNames.Any() || releasedSeatNames.Any())
        {
            await _notificationService.NotifyGroupChatMessageAsync(session.GroupSessionId, new ResGroupChatMessageDto
            {
                MessageId = Guid.NewGuid(),
                SenderId = userId,
                SenderName = "System",
                Content = contentText,
                MessageType = GroupChatMessageTypeEnum.SeatEvent,
                CreatedAt = DateTime.UtcNow
            }, GroupBookingCacheTtl.ForGroup(session.ExpiresAt));
        }

        var stateRes = await _getGroupBookingStateUseCase.ExecuteAsync(groupSessionId);
        return stateRes;
    }
}
