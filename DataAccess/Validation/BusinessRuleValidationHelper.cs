using DataAccess;
using DataAccess.Entities.UserInfos;
using DataAccess.Entities.MovieInfos;
using DataAccess.Entities.CinemaInfos;
using Shared.Enums;
using Microsoft.EntityFrameworkCore;

namespace Shared.Validation;

/// <summary>
/// Shared business rule validation methods used across UseCases.
/// Centralizes booking-related checks to avoid code duplication.
/// </summary>
public static class BusinessRuleValidationHelper
{
    /// <summary>
    /// Checks if a movie has any Booked (successfully paid) bookings via its schedules.
    /// </summary>
    public static async Task<bool> HasBookedBookingForMovie(this CinemaDbContext db, Guid movieId)
    {
        return await db.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleInfoEntity.MovieId == movieId
                            && od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked
                            && !od.MovieScheduleInfoEntity.IsDeleted);
    }

    /// <summary>
    /// Checks if a schedule has any Booked orders.
    /// </summary>
    public static async Task<bool> HasBookedBookingForSchedule(this CinemaDbContext db, Guid scheduleId)
    {
        return await db.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleId == scheduleId
                            && od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked);
    }

    /// <summary>
    /// Checks if a schedule has any Pending orders.
    /// </summary>
    public static async Task<bool> HasPendingOrdersForSchedule(this CinemaDbContext db, Guid scheduleId)
    {
        return await db.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleId == scheduleId
                            && od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Pending);
    }

    /// <summary>
    /// Checks if a cinema has any Booked bookings through its auditoriums → schedules.
    /// </summary>
    public static async Task<bool> HasBookedBookingForCinema(this CinemaDbContext db, Guid cinemaId)
    {
        return await db.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities.CinemaId == cinemaId
                            && od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked
                            && !od.MovieScheduleInfoEntity.IsDeleted);
    }

    /// <summary>
    /// Checks if an auditorium has any Booked bookings through its schedules.
    /// </summary>
    public static async Task<bool> HasBookedBookingForAuditorium(this CinemaDbContext db, Guid auditoriumId)
    {
        return await db.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.MovieScheduleInfoEntity.AuditoriumId == auditoriumId
                            && od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked);
    }

    /// <summary>
    /// Checks if any seat belonging to a specific auditorium has been booked (any order status).
    /// Used to prevent editing seat layouts when seats have been used.
    /// </summary>
    public static async Task<bool> HasAnyBookingForAuditoriumSeats(this CinemaDbContext db, Guid auditoriumId)
    {
        return await db.Set<OrderDetailsInfo>()
            .AnyAsync(od => od.SeatsInfoEntity.AuditoriumId == auditoriumId);
    }

    /// <summary>
    /// Gets the count of Booked orders for a specific schedule.
    /// </summary>
    public static async Task<int> GetBookedBookingCountForSchedule(this CinemaDbContext db, Guid scheduleId)
    {
        return await db.Set<OrderDetailsInfo>()
            .CountAsync(od => od.MovieScheduleId == scheduleId
                              && od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked);
    }

    /// <summary>
    /// Cancels all Pending orders related to a schedule.
    /// Used when a schedule is being soft-deleted.
    /// </summary>
    public static async Task CancelPendingOrdersForSchedule(this CinemaDbContext db, Guid scheduleId)
    {
        var pendingOrders = await db.Set<OrderInfoEntity>()
            .Where(o => o.OrderDetailsInfo.Any(od => od.MovieScheduleId == scheduleId)
                        && o.OrderStatus == OrderStatusEnum.Pending)
            .ToListAsync();

        foreach (var order in pendingOrders)
        {
            order.OrderStatus = OrderStatusEnum.Canceled;
        }

        if (pendingOrders.Count > 0)
        {
            await db.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Expires all Pending orders older than the specified number of minutes.
    /// Should be called from a background job or scheduled task.
    /// Returns the number of orders that were canceled.
    /// </summary>
    public static async Task<int> ExpireStalePendingOrders(this CinemaDbContext db, int expireAfterMinutes = 15)
    {
        var cutoff = DateTime.UtcNow.AddMinutes(-expireAfterMinutes);

        var staleOrders = await db.Set<OrderInfoEntity>()
            .Where(o => o.OrderStatus == OrderStatusEnum.Pending
                        && o.OrderDate < cutoff)
            .ToListAsync();

        foreach (var order in staleOrders)
        {
            order.OrderStatus = OrderStatusEnum.Canceled;
        }

        if (staleOrders.Count > 0)
        {
            await db.SaveChangesAsync();
        }

        return staleOrders.Count;
    }
}
