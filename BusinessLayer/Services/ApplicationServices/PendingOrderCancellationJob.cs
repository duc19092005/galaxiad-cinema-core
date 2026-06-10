using DataAccess;
using Shared.Validation;
using Hangfire;
using Microsoft.Extensions.Logging;

namespace BusinessLayer.Services.ApplicationServices;

/// <summary>
/// Recurring background job that automatically cancels stale Pending orders.
/// Runs every X minutes to free up seats that were held but never paid for.
/// </summary>
public class PendingOrderCancellationJob
{
    private readonly CinemaDbContext _dbContext;
    private readonly ILogger<PendingOrderCancellationJob> _logger;

    public PendingOrderCancellationJob(CinemaDbContext dbContext, ILogger<PendingOrderCancellationJob> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Called by Hangfire on a recurring schedule. 
    /// Expires all Pending orders older than 15 minutes.
    /// </summary>
    [AutomaticRetry(Attempts = 1)]
    public async Task ExecuteAsync(int expireAfterMinutes = 15)
    {
        try
        {
            var canceledCount = await _dbContext.ExpireStalePendingOrders(expireAfterMinutes);

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

/// <summary>
/// Extension methods for registering the PendingOrderCancellationJob with Hangfire.
/// </summary>
public static class PendingOrderCancellationJobExtensions
{
    /// <summary>
    /// Registers the recurring job in Hangfire.
    /// Call this from Program.cs after Hangfire is set up.
    /// </summary>
    public static void AddPendingOrderCancellationRecurringJob(
        this IRecurringJobManager recurringJobManager,
        int intervalMinutes = 5,
        int expireAfterMinutes = 15)
    {
        recurringJobManager.AddOrUpdate<PendingOrderCancellationJob>(
            "auto-cancel-pending-orders",
            job => job.ExecuteAsync(expireAfterMinutes),
            $"*/{intervalMinutes} * * * *"); // Every X minutes
    }
}
