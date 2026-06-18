using Application.Booking.Ports;
using DataAccess;
using DataAccess.Entities.CinemaInfos;
using DataAccess.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;
using Shared.Enums;

namespace Infrastructure.Booking;

/// <summary>
/// Cổng đọc cho luồng đặt vé, hiện thực bằng EF Core trên CinemaDbContext.
/// </summary>
public class BookingQueryRepository : IBookingQueryRepository
{
    private readonly CinemaDbContext _dbContext;

    public BookingQueryRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ScheduleBookingInfo?> GetScheduleForBookingAsync(
        Guid scheduleId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.MovieScheduleInfoEntity
            .Where(s => s.MovieScheduleInfoId == scheduleId && !s.IsDeleted)
            .Select(s => new ScheduleBookingInfo(
                s.MovieScheduleInfoId,
                s.MovieInfoEntity != null && s.MovieInfoEntity.IsActive,
                s.StartTime,
                s.AuditoriumId,
                s.AuditoriumInfoEntities != null ? s.AuditoriumInfoEntities.CinemaId : (Guid?)null,
                s.MovieFormatId,
                s.MovieFormatInfoEntity != null ? s.MovieFormatInfoEntity.MovieFormatPrice : 0))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<int> CountValidSeatsAsync(
        Guid auditoriumId, IReadOnlyCollection<Guid> seatIds, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SeatsInfoEntity
            .Where(s => s.AuditoriumId == auditoriumId && seatIds.Contains(s.SeatId))
            .CountAsync(cancellationToken);
    }

    public async Task<int> CountValidSegmentsAsync(
        IReadOnlyCollection<Guid> segmentIds, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Set<UserSegmentsInfoEntity>()
            .Where(seg => segmentIds.Contains(seg.UserSegmentId))
            .CountAsync(cancellationToken);
    }

    public async Task<List<Guid>> GetOccupiedSeatIdsAsync(
        Guid scheduleId, IReadOnlyCollection<Guid> seatIds, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .Where(od => od.MovieScheduleId == scheduleId
                         && seatIds.Contains(od.SeatId)
                         && (od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Pending
                             || od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked))
            .Select(od => od.SeatId)
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SurchargeInfo>> GetSurchargesAsync(
        Guid cinemaId, Guid formatId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Set<CinemaSurchargeInfosEntity>()
            .Where(s => s.CinemaId == cinemaId && s.MovieFormatId == formatId)
            .Select(s => new SurchargeInfo(s.UserSegmentId, s.SurchangePercent))
            .ToListAsync(cancellationToken);
    }

    public async Task<CustomerInfo?> GetUserCustomerInfoAsync(
        Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserInfoEntity
            .Where(u => u.UserId == userId)
            .Select(u => new CustomerInfo(
                u.UserProfileEntity != null ? u.UserProfileEntity.UserName : null,
                u.UserEmail))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
