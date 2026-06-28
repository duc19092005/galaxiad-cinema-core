using Cinema.Domain.Entities.UserInfos;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Application.Interfaces.Booking;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Cinema.Infrastructure.BackgroundJobs;

/// <summary>
/// Background job that automatically cancels stale Pending orders.
/// Runs as a recurring job and also on-demand for individual order timeouts.
/// </summary>
public class PendingOrderCancellationJob : IPendingOrderCancellationJob
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PendingOrderCancellationJob> _logger;
    private readonly ISeatLockerNotificationService _seatLockerNotificationService;

    public PendingOrderCancellationJob(
        IUnitOfWork unitOfWork, 
        ILogger<PendingOrderCancellationJob> logger,
        ISeatLockerNotificationService seatLockerNotificationService)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
        _seatLockerNotificationService = seatLockerNotificationService;
    }

    /// <summary>
    /// Expires all Pending orders older than 15 minutes.
    /// </summary>
    public async Task ExecuteAsync(int expireAfterMinutes = 15)
    {
        try
        {
            var cutoff = DateTime.UtcNow.AddMinutes(-expireAfterMinutes);
            var staleOrders = await _unitOfWork.Repository<OrderInfoEntity>().Query()
                .Include(o => o.OrderDetailsInfo)
                .Where(o => o.OrderStatus == OrderStatusEnum.Pending && o.OrderDate < cutoff)
                .ToListAsync();

            foreach (var order in staleOrders)
            {
                await CancelOrderAndNotifyAsync(order);
            }

            var canceledCount = staleOrders.Count;
            if (canceledCount > 0)
            {
                await _unitOfWork.SaveChangesAsync();
                _logger.LogInformation(
                    "PendingOrderCancellationJob: Auto-canceled {Count} stale pending orders (expired after {Minutes} minutes)",
                    canceledCount, expireAfterMinutes);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PendingOrderCancellationJob: Error while canceling stale pending orders");
            throw;
        }
    }

    /// <summary>
    /// Forcefully cancels a specific order if it is still Pending, and notifies clients via SignalR to release the seats.
    /// </summary>
    public async Task ExecuteForOrderAsync(Guid orderId)
    {
        try
        {
            var order = await _unitOfWork.Repository<OrderInfoEntity>().Query()
                .Include(o => o.OrderDetailsInfo)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order != null && order.OrderStatus == OrderStatusEnum.Pending)
            {
                await CancelOrderAndNotifyAsync(order);
                await _unitOfWork.SaveChangesAsync();
                _logger.LogInformation("PendingOrderCancellationJob: Order {OrderId} timed out and was auto-canceled.", orderId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PendingOrderCancellationJob: Error while canceling specific order {OrderId}", orderId);
            throw;
        }
    }

    private async Task CancelOrderAndNotifyAsync(OrderInfoEntity order)
    {
        order.OrderStatus = OrderStatusEnum.Canceled;
        
        var details = order.OrderDetailsInfo;
        if (details != null && details.Count > 0)
        {
            var scheduleId = details.First().MovieScheduleId.ToString();
            var seatIds = details.Select(od => od.SeatId.ToString()).ToList();
            
            try
            {
                await _seatLockerNotificationService.NotifySeatsReleasedAsync(scheduleId, seatIds);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "PendingOrderCancellationJob: Failed to send SignalR notification for released seats of order {OrderId}", order.OrderId);
            }
        }
    }
}
