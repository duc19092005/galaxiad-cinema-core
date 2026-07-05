using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.GroupBooking;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
using Microsoft.EntityFrameworkCore;
namespace Cinema.Infrastructure.Persistence.Repositories.Booking;

public class GroupBookingRepository : IGroupBookingRepository
{
    private readonly CinemaDbContext _dbContext;
    private readonly ICommonBookingQueries _common;

    public GroupBookingRepository(CinemaDbContext dbContext, ICommonBookingQueries common)
    {
        _dbContext = dbContext;
        _common = common;
    }

    public async Task<GroupBookingSessionEntity?> GetSessionByIdAsync(Guid groupSessionId)
    {
        return await _dbContext.Set<GroupBookingSessionEntity>()
            .FirstOrDefaultAsync(s => s.GroupSessionId == groupSessionId);
    }

    public async Task<GroupBookingSessionEntity?> GetSessionByCodeAsync(string groupCode)
    {
        return await _dbContext.Set<GroupBookingSessionEntity>()
            .FirstOrDefaultAsync(s => s.GroupCode == groupCode);
    }

    public async Task<GroupBookingSessionEntity?> GetSessionWithMembersAsync(Guid groupSessionId)
    {
        return await _dbContext.Set<GroupBookingSessionEntity>()
            .Include(s => s.Members)
                .ThenInclude(m => m.UserInfoEntity)
            .Include(s => s.Members)
                .ThenInclude(m => m.SelectedSeats)
                    .ThenInclude(ss => ss.SeatsInfoEntity)
            .Include(s => s.MovieScheduleInfoEntity)
                .ThenInclude(ms => ms.MovieInfoEntity)
            .Include(s => s.MovieScheduleInfoEntity)
                .ThenInclude(ms => ms.MovieFormatInfoEntity)
            .Include(s => s.MovieScheduleInfoEntity)
                .ThenInclude(ms => ms.AuditoriumInfoEntities)
            .AsSplitQuery()
            .FirstOrDefaultAsync(s => s.GroupSessionId == groupSessionId);
    }

    public async Task<GroupBookingMemberEntity?> GetMemberAsync(Guid groupSessionId, Guid userId)
    {
        return await _dbContext.Set<GroupBookingMemberEntity>()
            .Include(m => m.SelectedSeats)
            .FirstOrDefaultAsync(m => m.GroupSessionId == groupSessionId && m.UserId == userId);
    }

    public async Task<GroupBookingMemberEntity?> GetMemberByIdAsync(Guid memberId)
    {
        return await _dbContext.Set<GroupBookingMemberEntity>()
            .Include(m => m.GroupBookingSession)
            .Include(m => m.UserInfoEntity)
            .Include(m => m.SelectedSeats)
            .FirstOrDefaultAsync(m => m.MemberId == memberId);
    }

    public async Task<List<GroupBookingSeatEntity>> GetMemberSeatsAsync(Guid memberId)
    {
        return await _dbContext.Set<GroupBookingSeatEntity>()
            .Include(s => s.SeatsInfoEntity)
            .Where(s => s.MemberId == memberId)
            .ToListAsync();
    }

    public Task<List<Guid>> GetOccupiedSeatIdsAsync(Guid scheduleId, Guid excludeGroupSessionId)
        => _common.GetOccupiedSeatIdsAsync(scheduleId, excludeGroupSessionId);

    public Task<List<SeatsInfoEntity>> GetValidSeatsAsync(Guid auditoriumId, List<Guid> seatIds)
        => _common.GetValidSeatsAsync(auditoriumId, seatIds);

    public Task<MovieScheduleInfoEntity?> GetScheduleByIdAsync(Guid scheduleId)
        => _common.GetScheduleByIdAsync(scheduleId);

    public Task<UserInfoEntity?> FindUserByIdAsync(Guid userId)
        => _common.FindUserByIdAsync(userId);

    public async Task<UserInfoEntity?> FindUserByEmailAsync(string email)
    {
        return await _dbContext.Set<UserInfoEntity>()
            .FirstOrDefaultAsync(u => u.UserEmail == email);
    }

    public async Task AddSessionAsync(GroupBookingSessionEntity session)
    {
        await _dbContext.Set<GroupBookingSessionEntity>().AddAsync(session);
    }

    public async Task AddMemberAsync(GroupBookingMemberEntity member)
    {
        await _dbContext.Set<GroupBookingMemberEntity>().AddAsync(member);
    }

    public async Task AddMemberRangeAsync(List<GroupBookingMemberEntity> members)
    {
        await _dbContext.Set<GroupBookingMemberEntity>().AddRangeAsync(members);
    }

    public async Task AddSeatRangeAsync(List<GroupBookingSeatEntity> seats)
    {
        await _dbContext.Set<GroupBookingSeatEntity>().AddRangeAsync(seats);
    }

    public void UpdateSession(GroupBookingSessionEntity session)
    {
        _dbContext.Set<GroupBookingSessionEntity>().Update(session);
    }

    public void UpdateMember(GroupBookingMemberEntity member)
    {
        _dbContext.Set<GroupBookingMemberEntity>().Update(member);
    }

    public void RemoveSeats(List<GroupBookingSeatEntity> seats)
    {
        _dbContext.Set<GroupBookingSeatEntity>().RemoveRange(seats);
    }

    public async Task<List<GroupBookingSeatEntity>> GetAllGroupSeatsAsync(Guid groupSessionId)
    {
        return await _dbContext.Set<GroupBookingSeatEntity>()
            .Where(gs => gs.GroupBookingMember.GroupSessionId == groupSessionId)
            .Include(gs => gs.SeatsInfoEntity)
            .ToListAsync();
    }

    public async Task<bool> IsSeatOccupiedByOtherGroupAsync(Guid seatId, Guid scheduleId, Guid excludeGroupSessionId)
    {
        return await _dbContext.Set<GroupBookingSeatEntity>()
            .AnyAsync(gs => gs.SeatId == seatId
                            && gs.GroupBookingMember.GroupSessionId != excludeGroupSessionId
                            && gs.GroupBookingMember.GroupBookingSession.MovieScheduleId == scheduleId
                            && gs.GroupBookingMember.GroupBookingSession.Status != GroupBookingStatusEnum.Cancelled);
    }

    public async Task<int> GetMemberCountAsync(Guid groupSessionId)
    {
        return await _dbContext.Set<GroupBookingMemberEntity>()
            .CountAsync(m => m.GroupSessionId == groupSessionId && m.Status != GroupMemberStatusEnum.Removed);
    }

    public async Task<GroupBookingSessionEntity?> FindSessionByPartialIdAsync(string partialId)
    {
        return await _dbContext.Set<GroupBookingSessionEntity>()
            .Include(s => s.Members)
                .ThenInclude(m => m.UserInfoEntity)
            .Include(s => s.Members)
                .ThenInclude(m => m.SelectedSeats)
                    .ThenInclude(ss => ss.SeatsInfoEntity)
            .Include(s => s.MovieScheduleInfoEntity)
            .AsSplitQuery()
            .FirstOrDefaultAsync(s => s.GroupSessionId.ToString().Replace("-", "").StartsWith(partialId));
    }

    public async Task<List<GroupBookingSeatEntity>> GetAllGroupSeatsWithInfoAsync(Guid groupSessionId)
    {
        return await _dbContext.Set<GroupBookingSeatEntity>()
            .Where(gs => gs.GroupBookingMember.GroupSessionId == groupSessionId)
            .Include(gs => gs.SeatsInfoEntity)
            .Include(gs => gs.GroupBookingMember)
            .ToListAsync();
    }

    public async Task<List<GroupBookingSessionEntity>> GetVotingSessionsAsync()
    {
        return await _dbContext.Set<GroupBookingSessionEntity>()
            .Where(s => s.Status == GroupBookingStatusEnum.VotingPaymentMethod)
            .ToListAsync();
    }
}
