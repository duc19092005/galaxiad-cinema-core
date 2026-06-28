using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Persistence.Validation;

public class BookingBusinessRuleService : IBookingBusinessRuleService
{
    private readonly CinemaDbContext _dbContext;

    public BookingBusinessRuleService(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> HasBookedBookingForMovieAsync(Guid movieId)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleInfoEntity.MovieId == movieId
                            && od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked
                            && !od.MovieScheduleInfoEntity.IsDeleted);
    }

    public async Task<bool> HasBookedBookingForScheduleAsync(Guid scheduleId)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleId == scheduleId
                            && od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked);
    }

    public async Task<bool> HasPendingOrdersForScheduleAsync(Guid scheduleId)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleId == scheduleId
                            && od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Pending);
    }

    public async Task<bool> HasBookedBookingForCinemaAsync(Guid cinemaId)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleInfoEntity != null 
                            && od.MovieScheduleInfoEntity.AuditoriumInfoEntities != null 
                            && od.MovieScheduleInfoEntity.AuditoriumInfoEntities.CinemaId == cinemaId
                            && od.OrderInfoEntity != null
                            && od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked
                            && !od.MovieScheduleInfoEntity.IsDeleted);
    }

    public async Task<bool> HasBookedBookingForAuditoriumAsync(Guid auditoriumId)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleInfoEntity.AuditoriumId == auditoriumId
                            && od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked);
    }

    public async Task<bool> HasAnyBookingForAuditoriumSeatsAsync(Guid auditoriumId)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.SeatsInfoEntity.AuditoriumId == auditoriumId);
    }

    public async Task<int> GetBookedBookingCountForScheduleAsync(Guid scheduleId)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .CountAsync(od => od.MovieScheduleId == scheduleId
                              && od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked);
    }

    public async Task<int> MarkPendingOrdersForScheduleCanceledAsync(Guid scheduleId)
    {
        var pendingOrders = await _dbContext.Set<OrderInfoEntity>()
            .Where(o => o.OrderDetailsInfo.Any(od => od.MovieScheduleId == scheduleId)
                        && o.OrderStatus == OrderStatusEnum.Pending)
            .ToListAsync();

        foreach (var order in pendingOrders)
        {
            order.OrderStatus = OrderStatusEnum.Canceled;
        }

        return pendingOrders.Count;
    }

    public async Task<int> MarkStalePendingOrdersCanceledAsync(int expireAfterMinutes = 15)
    {
        var cutoff = DateTime.UtcNow.AddMinutes(-expireAfterMinutes);

        var staleOrders = await _dbContext.Set<OrderInfoEntity>()
            .Where(o => o.OrderStatus == OrderStatusEnum.Pending
                        && o.OrderDate < cutoff)
            .ToListAsync();

        foreach (var order in staleOrders)
        {
            order.OrderStatus = OrderStatusEnum.Canceled;
        }

        return staleOrders.Count;
    }
}
