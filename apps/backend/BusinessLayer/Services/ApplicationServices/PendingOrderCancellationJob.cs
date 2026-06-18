using BusinessLayer.Entities.UserInfos;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Shared.Enums;
using Shared.Interfaces.Persistence;

namespace BusinessLayer.Services.ApplicationServices;

/// <summary>
/// Recurring background job that automatically cancels stale Pending orders.
/// Runs every X minutes to free up seats that were held but never paid for.
/// </summary>
public class PendingOrderCancellationJob
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PendingOrderCancellationJob> _logger;

    public PendingOrderCancellationJob(IUnitOfWork unitOfWork, ILogger<PendingOrderCancellationJob> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
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
                .Where(o => o.OrderStatus == OrderStatusEnum.Pending && o.OrderDate < cutoff)
                .ToListAsync();

            foreach (var order in staleOrders)
            {
                order.OrderStatus = OrderStatusEnum.Canceled;
            }

            var canceledCount = staleOrders.Count;
            if (canceledCount > 0)
            {
                await _unitOfWork.SaveChangesAsync();
            }

            if (canceledCount > 0)
            {
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
}
