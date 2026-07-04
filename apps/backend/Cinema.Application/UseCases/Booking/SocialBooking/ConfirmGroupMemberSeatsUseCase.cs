using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.UseCases.Booking.Services;
using Cinema.Domain.Entities.GroupBooking;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class ConfirmGroupMemberSeatsUseCase
{
    private readonly IGroupBookingRepository _groupBookingRepository;
    private readonly IUserContextService _userContextService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISeatLockerNotificationService _notificationService;
    private readonly GetGroupBookingStateUseCase _getGroupBookingStateUseCase;
    private readonly BookingPricingService _bookingPricingService;

    public ConfirmGroupMemberSeatsUseCase(
        IGroupBookingRepository groupBookingRepository,
        IUserContextService userContextService,
        IUnitOfWork unitOfWork,
        ISeatLockerNotificationService notificationService,
        GetGroupBookingStateUseCase getGroupBookingStateUseCase,
        BookingPricingService bookingPricingService)
    {
        _groupBookingRepository = groupBookingRepository;
        _userContextService = userContextService;
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
        _getGroupBookingStateUseCase = getGroupBookingStateUseCase;
        _bookingPricingService = bookingPricingService;
    }

    public async Task<BaseResponse<ResConfirmGroupMemberSeatsDto>> ExecuteAsync(Guid groupSessionId, ReqConfirmGroupSeatsDto request)
    {
        var userId = _userContextService.GetUserId();

        var session = await _groupBookingRepository.GetSessionWithMembersAsync(groupSessionId);
        if (session == null)
            throw new NotFoundException("Group booking session not found");

        if (session.Status != GroupBookingStatusEnum.Open && session.Status != GroupBookingStatusEnum.SeatsSelected && session.Status != GroupBookingStatusEnum.Confirming)
            throw new BadRequestException("Cannot confirm seats in current session status", "GBK30");


        var member = session.Members.FirstOrDefault(m => m.UserId == userId && m.Status != GroupMemberStatusEnum.Removed);
        if (member == null)
            throw new BadRequestException("You are not a member of this group", "GBK31");

        var scheduleIdStr = session.MovieScheduleId.ToString();
        var heldLocks = (await _notificationService.GetGroupMemberSelectionsAsync(
                scheduleIdStr,
                session.GroupSessionId,
                member.MemberId))
            .ToList();

        if (heldLocks.Count == 0)
            throw new BadRequestException("You have no seats selected to confirm", "GBK32");

        var requestedSeatIds = (request?.SeatIds ?? []).ToHashSet();
        if (requestedSeatIds.Count > 0 && !heldLocks.All(l => requestedSeatIds.Contains(Guid.Parse(l.SeatId))))
            throw new BadRequestException("Confirmed seats do not match your active seat locks", "GBK33");

        var confirmSelections = (request?.SeatSelections ?? [])
            .GroupBy(s => s.SeatId)
            .Select(g => g.First())
            .ToList();
        var confirmSegmentsBySeat = confirmSelections.ToDictionary(s => s.SeatId, s => s.UserSegmentId);

        var seatSelections = heldLocks.Select(l => new SeatSelectionDto
        {
            SeatId = Guid.Parse(l.SeatId),
            UserSegmentId = confirmSegmentsBySeat.TryGetValue(Guid.Parse(l.SeatId), out var segmentId)
                ? segmentId
                : l.UserSegmentId ?? Guid.Empty
        }).ToList();

        if (seatSelections.Any(s => s.UserSegmentId == Guid.Empty))
            throw new BadRequestException("One or more selected seats are missing user segment", "GBK34");

        if (session.MovieScheduleInfoEntity == null)
            throw new BadRequestException("Schedule information is missing", "GBK35");

        var (pricedDetails, totalPrice) = await _bookingPricingService.CalculateSeatPricesAsync(
            session.MovieScheduleInfoEntity,
            seatSelections,
            Guid.Empty);

        var existingMemberSeats = member.SelectedSeats?.ToList() ?? [];
        if (existingMemberSeats.Count > 0)
            _groupBookingRepository.RemoveSeats(existingMemberSeats);

        var pricesBySeat = pricedDetails.ToDictionary(d => d.SeatId, d => d.PriceEach);
        var newSeats = seatSelections.Select(selection => new GroupBookingSeatEntity
        {
            GroupSeatId = Guid.NewGuid(),
            MemberId = member.MemberId,
            SeatId = selection.SeatId,
            PriceEach = pricesBySeat.GetValueOrDefault(selection.SeatId),
            IsConfirmed = true,
            SelectedAt = DateTime.UtcNow
        }).ToList();

        await _groupBookingRepository.AddSeatRangeAsync(newSeats);

        member.Status = GroupMemberStatusEnum.Confirmed;
        member.AmountToPay = totalPrice;
        _groupBookingRepository.UpdateMember(member);

        var allMembers = session.Members.Where(m => m.Status != GroupMemberStatusEnum.Removed).ToList();
        var allConfirmed = allMembers.All(m => m.Status == GroupMemberStatusEnum.Confirmed || m.Status == GroupMemberStatusEnum.Paid);

        session.Status = allMembers.Any(m => m.Status == GroupMemberStatusEnum.Confirmed || m.MemberId == member.MemberId)
            ? GroupBookingStatusEnum.Confirming
            : session.Status;
        session.TotalGroupAmount = session.Members
            .Where(m => m.Status != GroupMemberStatusEnum.Removed)
            .Sum(m => m.MemberId == member.MemberId ? totalPrice : m.AmountToPay);

        if (allConfirmed)
        {
            session.Status = GroupBookingStatusEnum.Confirming;
        }
        _groupBookingRepository.UpdateSession(session);

        await _unitOfWork.SaveChangesAsync();

        var user = await _groupBookingRepository.FindUserByIdAsync(userId);
        var userName = user?.UserName ?? "Member";
        var roleLabel = member.IsHost ? "[Chủ phòng]" : "[Thành viên]";

        await _notificationService.NotifyGroupChatMessageAsync(session.GroupSessionId, new ResGroupChatMessageDto
        {
            MessageId = Guid.NewGuid(),
            SenderId = userId,
            SenderName = "System",
            Content = allConfirmed
                ? $"{roleLabel} {userName} đã xác nhận ghế. Tất cả thành viên đã xác nhận - chờ chủ phòng thanh toán!"
                : $"{roleLabel} {userName} đã xác nhận ghế ({allMembers.Count(m => m.Status == GroupMemberStatusEnum.Confirmed)}/{allMembers.Count})",
            MessageType = GroupChatMessageTypeEnum.SystemEvent,
            CreatedAt = DateTime.UtcNow
        });

        var confirmedCount = allMembers.Count(m => m.Status == GroupMemberStatusEnum.Confirmed);

        return new BaseResponse<ResConfirmGroupMemberSeatsDto>
        {
            IsSuccess = true,
            Data = new ResConfirmGroupMemberSeatsDto
            {
                IsAllConfirmed = allConfirmed,
                ConfirmedCount = confirmedCount,
                TotalMembers = allMembers.Count,
                SessionStatus = session.Status
            },
            Message = "Seats confirmed successfully"
        };
    }
}
