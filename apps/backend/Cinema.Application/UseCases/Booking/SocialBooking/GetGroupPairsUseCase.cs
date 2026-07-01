using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Entities.GroupBooking;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.Booking.SocialBooking;

public class GetGroupPairsUseCase
{
    private readonly IGroupBookingRepository _repo;
    private readonly IGroupBookingCacheService _cache;

    public GetGroupPairsUseCase(IGroupBookingRepository repo, IGroupBookingCacheService cache)
    {
        _repo = repo;
        _cache = cache;
    }

    public async Task<BaseResponse<List<ResGroupPairDto>>> ExecuteAsync(Guid groupSessionId)
    {
        var session = await _repo.GetSessionByIdAsync(groupSessionId)
            ?? throw new NotFoundException("Group booking session not found");

        var pairs = await _cache.GetAcceptedPairsAsync(groupSessionId);
        var sessionWithMembers = await _repo.GetSessionWithMembersAsync(groupSessionId);
        var activeMembers = sessionWithMembers?.Members
            .Where(m => m.Status != GroupMemberStatusEnum.Removed)
            .ToList() ?? [];

        var pairedIds = pairs.SelectMany(p => new[] { p.Member1Id, p.Member2Id }).ToHashSet();
        var unpaired = activeMembers.Where(m => !pairedIds.Contains(m.MemberId)).ToList();

        var result = pairs.Select(p =>
        {
            var m1 = activeMembers.FirstOrDefault(m => m.MemberId == p.Member1Id);
            var m2 = activeMembers.FirstOrDefault(m => m.MemberId == p.Member2Id);
            return new ResGroupPairDto
            {
                PairId = Guid.NewGuid(),
                Member1 = MapMember(m1),
                Member2 = MapMember(m2),
                Status = GroupPairRequestStatusEnum.Accepted,
                TotalAmount = (m1?.AmountToPay ?? 0) + (m2?.AmountToPay ?? 0),
                SeatCount = (m1?.SelectedSeats?.Count ?? 0) + (m2?.SelectedSeats?.Count ?? 0)
            };
        }).ToList();

        foreach (var m in unpaired)
            result.Add(new ResGroupPairDto
            {
                PairId = Guid.Empty,
                Member1 = MapMember(m),
                Status = GroupPairRequestStatusEnum.Accepted,
                TotalAmount = m.AmountToPay,
                SeatCount = m.SelectedSeats?.Count ?? 0
            });

        return new BaseResponse<List<ResGroupPairDto>> { IsSuccess = true, Data = result, Message = "OK" };
    }

    private static GroupMemberDto MapMember(GroupBookingMemberEntity? m) => m == null ? new GroupMemberDto() : new()
    {
        MemberId = m.MemberId, UserId = m.UserId, UserName = m.UserInfoEntity?.UserName ?? "",
        AvatarUrl = m.UserInfoEntity?.PortraitImageUrl, IsHost = m.IsHost, Status = m.Status,
        AmountToPay = m.AmountToPay, AmountPaid = m.AmountPaid, PairId = m.PairId,
        SelectedSeats = m.SelectedSeats?.Select(s => new GroupSeatDto
        {
            SeatId = s.SeatId, PriceEach = s.PriceEach, IsConfirmed = s.IsConfirmed
        }).ToList() ?? []
    };
}
