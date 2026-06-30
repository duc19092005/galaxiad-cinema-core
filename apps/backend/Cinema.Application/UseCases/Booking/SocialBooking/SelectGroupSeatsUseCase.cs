using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.UseCases.Booking.Services;
using Cinema.Domain.Entities.GroupBooking;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Enums;
using Cinema.Domain.Localization;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class SelectGroupSeatsUseCase
{
    private readonly IGroupBookingRepository _groupBookingRepository;
    private readonly IUserContextService _userContextService;
    private readonly ILogger<SelectGroupSeatsUseCase> _logger;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISeatLockerNotificationService _notificationService;
    private readonly GetGroupBookingStateUseCase _getGroupBookingStateUseCase;
    private readonly BookingPricingService _bookingPricingService;

    public SelectGroupSeatsUseCase(
        IGroupBookingRepository groupBookingRepository,
        IUserContextService userContextService,
        ILogger<SelectGroupSeatsUseCase> logger,
        IUnitOfWork unitOfWork,
        ISeatLockerNotificationService notificationService,
        GetGroupBookingStateUseCase getGroupBookingStateUseCase,
        BookingPricingService bookingPricingService)
    {
        _groupBookingRepository = groupBookingRepository;
        _userContextService = userContextService;
        _logger = logger;
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
        _getGroupBookingStateUseCase = getGroupBookingStateUseCase;
        _bookingPricingService = bookingPricingService;
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

        // Check standard user locked seats in memory
        var scheduleIdStr = session.MovieScheduleId.ToString();
        var standardLockedSeats = _notificationService.GetCurrentLockedSeats(scheduleIdStr);
        foreach (var seatId in seatIds)
        {
            if (standardLockedSeats.ContainsKey(seatId.ToString().ToLower()))
                throw new BadRequestException("Seat is temporarily locked by another user", "GBK26");
        }

        // Check in-memory group selections
        var activeSelections = _notificationService.GetGroupSelectionsForSchedule(scheduleIdStr);
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

        var existingMemberSeats = member.SelectedSeats?.ToList() ?? [];
        if (existingMemberSeats.Count > 0)
        {
            _groupBookingRepository.RemoveSeats(existingMemberSeats);
        }

        var memberAmountToPay = 0m;
        if (seatSelections.Count > 0 && session.MovieScheduleInfoEntity != null)
        {
            var pricingSelections = seatSelections
                .Select(s => new SeatSelectionDto
                {
                    SeatId = s.SeatId,
                    UserSegmentId = s.UserSegmentId
                })
                .ToList();

            var (pricedDetails, totalPrice) = await _bookingPricingService.CalculateSeatPricesAsync(
                session.MovieScheduleInfoEntity,
                pricingSelections,
                Guid.Empty);

            memberAmountToPay = totalPrice;
            var pricesBySeat = pricedDetails.ToDictionary(d => d.SeatId, d => d.PriceEach);
            var newSeats = seatIds.Select(seatId => new GroupBookingSeatEntity
            {
                GroupSeatId = Guid.NewGuid(),
                MemberId = member.MemberId,
                SeatId = seatId,
                PriceEach = pricesBySeat.GetValueOrDefault(seatId),
                IsConfirmed = false,
                SelectedAt = DateTime.UtcNow
            }).ToList();

            await _groupBookingRepository.AddSeatRangeAsync(newSeats);
        }

        member.Status = seatIds.Count > 0 ? GroupMemberStatusEnum.SeatsSelected : GroupMemberStatusEnum.Joined;
        member.AmountToPay = memberAmountToPay;
        _groupBookingRepository.UpdateMember(member);

        var otherMembersHaveSeats = activeSelections.Any(s =>
            s.Value.GroupSessionId == session.GroupSessionId && s.Value.MemberId != member.MemberId);
        var groupHasSeatsAfterChange = seatIds.Count > 0 || otherMembersHaveSeats;
        if (session.Status == GroupBookingStatusEnum.Open || session.Status == GroupBookingStatusEnum.SeatsSelected)
        {
            session.Status = groupHasSeatsAfterChange ? GroupBookingStatusEnum.SeatsSelected : GroupBookingStatusEnum.Open;
            session.TotalGroupAmount = session.Members
                .Where(m => m.Status != GroupMemberStatusEnum.Removed)
                .Sum(m => m.MemberId == member.MemberId ? memberAmountToPay : m.AmountToPay);
            _groupBookingRepository.UpdateSession(session);
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

        await _notificationService.NotifyGroupChatMessageAsync(session.GroupSessionId, new ResGroupChatMessageDto
        {
            MessageId = Guid.NewGuid(),
            SenderId = userId,
            SenderName = "System",
            Content = contentText,
            MessageType = GroupChatMessageTypeEnum.SeatEvent,
            CreatedAt = DateTime.UtcNow
        });

        // Broadcast changes in real-time to active subscribers and update memory dictionary
        _notificationService.UpdateGroupMemberSelection(
            scheduleIdStr, session.GroupSessionId, member.MemberId, userName, seatIds.Select(id => id.ToString()).ToList());

        await _unitOfWork.SaveChangesAsync();

        var stateRes = await _getGroupBookingStateUseCase.ExecuteAsync(groupSessionId);
        return stateRes;
    }
}
