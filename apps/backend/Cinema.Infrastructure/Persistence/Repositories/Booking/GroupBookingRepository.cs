using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.GroupBooking;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
using Microsoft.EntityFrameworkCore;
namespace Cinema.Infrastructure.Repositories;

public class GroupBookingRepository : IGroupBookingRepository
{
    private readonly CinemaDbContext _dbContext;

    public GroupBookingRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
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

    public async Task<List<Guid>> GetOccupiedSeatIdsAsync(Guid scheduleId, Guid excludeGroupSessionId)
    {
        var bookedSeats = await _dbContext.Set<OrderDetailsInfo>()
            .Where(od => od.MovieScheduleId == scheduleId
                         && (od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Pending
                             || od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked))
            .Select(od => od.SeatId)
            .ToListAsync();

        var groupSeats = await _dbContext.Set<GroupBookingSeatEntity>()
            .Where(gs => gs.GroupBookingMember.GroupSessionId != excludeGroupSessionId
                         && gs.GroupBookingMember.GroupBookingSession.MovieScheduleId == scheduleId
                         && gs.GroupBookingMember.GroupBookingSession.Status != GroupBookingStatusEnum.Cancelled)
            .Select(gs => gs.SeatId)
            .ToListAsync();

        return bookedSeats.Concat(groupSeats).Distinct().ToList();
    }

    public async Task<List<SeatsInfoEntity>> GetValidSeatsAsync(Guid auditoriumId, List<Guid> seatIds)
    {
        return await _dbContext.Set<SeatsInfoEntity>()
            .Where(s => s.AuditoriumId == auditoriumId && seatIds.Contains(s.SeatId))
            .ToListAsync();
    }

    public async Task<MovieScheduleInfoEntity?> GetScheduleByIdAsync(Guid scheduleId)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .Include(s => s.MovieFormatInfoEntity)
            .Include(s => s.MovieInfoEntity)
            .Include(s => s.AuditoriumInfoEntities)
            .FirstOrDefaultAsync(s => s.MovieScheduleInfoId == scheduleId && !s.IsDeleted);
    }

    public async Task<UserInfoEntity?> FindUserByIdAsync(Guid userId)
    {
        return await _dbContext.Set<UserInfoEntity>()
            .FirstOrDefaultAsync(u => u.UserId == userId);
    }

    public async Task<UserInfoEntity?> FindUserByEmailAsync(string email)
    {
        return await _dbContext.Set<UserInfoEntity>()
            .FirstOrDefaultAsync(u => u.UserEmail == email);
    }

    public async Task<List<GroupChatMessageEntity>> GetChatMessagesAsync(Guid groupSessionId, int limit = 50, DateTime? before = null)
    {
        var query = _dbContext.Set<GroupChatMessageEntity>()
            .Include(m => m.UserInfoEntity)
            .Where(m => m.GroupSessionId == groupSessionId);

        if (before.HasValue)
            query = query.Where(m => m.CreatedAt < before.Value);

        return await query
            .OrderByDescending(m => m.CreatedAt)
            .Take(limit)
            .ToListAsync();
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

    public async Task AddChatMessageAsync(GroupChatMessageEntity message)
    {
        await _dbContext.Set<GroupChatMessageEntity>().AddAsync(message);
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
}
