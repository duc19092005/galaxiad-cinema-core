using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.GroupBooking;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Application.Interfaces.Booking;

public interface IGroupBookingRepository
{
    Task<GroupBookingSessionEntity?> GetSessionByIdAsync(Guid groupSessionId);
    Task<GroupBookingSessionEntity?> GetSessionByCodeAsync(string groupCode);
    Task<GroupBookingSessionEntity?> GetSessionWithMembersAsync(Guid groupSessionId);
    Task<GroupBookingMemberEntity?> GetMemberAsync(Guid groupSessionId, Guid userId);
    Task<GroupBookingMemberEntity?> GetMemberByIdAsync(Guid memberId);
    Task<List<GroupBookingSeatEntity>> GetMemberSeatsAsync(Guid memberId);
    Task<List<Guid>> GetOccupiedSeatIdsAsync(Guid scheduleId, Guid excludeGroupSessionId);
    Task<List<SeatsInfoEntity>> GetValidSeatsAsync(Guid auditoriumId, List<Guid> seatIds);
    Task<MovieScheduleInfoEntity?> GetScheduleByIdAsync(Guid scheduleId);
    Task<UserInfoEntity?> FindUserByIdAsync(Guid userId);
    Task<UserInfoEntity?> FindUserByEmailAsync(string email);
    Task<List<GroupChatMessageEntity>> GetChatMessagesAsync(Guid groupSessionId, int limit = 50, DateTime? before = null);
    Task AddSessionAsync(GroupBookingSessionEntity session);
    Task AddMemberAsync(GroupBookingMemberEntity member);
    Task AddMemberRangeAsync(List<GroupBookingMemberEntity> members);
    Task AddSeatRangeAsync(List<GroupBookingSeatEntity> seats);
    Task AddChatMessageAsync(GroupChatMessageEntity message);
    void UpdateSession(GroupBookingSessionEntity session);
    void UpdateMember(GroupBookingMemberEntity member);
    void RemoveSeats(List<GroupBookingSeatEntity> seats);
    Task<List<GroupBookingSeatEntity>> GetAllGroupSeatsAsync(Guid groupSessionId);
    Task<bool> IsSeatOccupiedByOtherGroupAsync(Guid seatId, Guid scheduleId, Guid excludeGroupSessionId);
    Task<int> GetMemberCountAsync(Guid groupSessionId);
    Task<GroupBookingSessionEntity?> FindSessionByPartialIdAsync(string partialId);
    Task<List<GroupBookingSeatEntity>> GetAllGroupSeatsWithInfoAsync(Guid groupSessionId);

    // Voting sessions query for Background Service
    Task<List<GroupBookingSessionEntity>> GetVotingSessionsAsync();
}
