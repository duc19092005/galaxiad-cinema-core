using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Entities.GroupBooking;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class GetGroupBookingStateUseCase
{
    private readonly IGroupBookingRepository _groupBookingRepository;
    private readonly ISeatLockerNotificationService _notificationService;

    public GetGroupBookingStateUseCase(
        IGroupBookingRepository groupBookingRepository,
        ISeatLockerNotificationService notificationService)
    {
        _groupBookingRepository = groupBookingRepository;
        _notificationService = notificationService;
    }

    public async Task<BaseResponse<ResGroupBookingStateDto>> ExecuteAsync(Guid groupSessionId)
    {
        var session = await _groupBookingRepository.GetSessionWithMembersAsync(groupSessionId);
        if (session == null)
            throw new NotFoundException("Group booking session not found");

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
            Members = session.Members?
                .Where(m => m.Status != GroupMemberStatusEnum.Removed)
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
                    SelectedSeats = allSeats.Where(s => s.MemberId == m.MemberId).ToList()
                }).ToList() ?? new List<GroupMemberDto>(),
            AllGroupSeats = allSeats
        };

        return new BaseResponse<ResGroupBookingStateDto>
        {
            IsSuccess = true,
            Data = stateDto,
            Message = "Group state retrieved"
        };
    }
}
