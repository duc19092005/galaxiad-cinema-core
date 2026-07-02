using Cinema.Infrastructure.BackgroundJobs.Bookings;
using Hangfire;

namespace Cinema.Infrastructure.ExternalServices.Jobs;

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
