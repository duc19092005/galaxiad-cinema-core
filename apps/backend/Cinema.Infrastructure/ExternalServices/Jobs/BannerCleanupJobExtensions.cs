using Cinema.Infrastructure.BackgroundJobs.Banners;
using Hangfire;

namespace Cinema.Infrastructure.ExternalServices.Jobs;

public static class BannerCleanupJobExtensions
{
    public static void AddBannerCleanupRecurringJob(
        this IRecurringJobManager recurringJobManager,
        int intervalMinutes = 30)
    {
        recurringJobManager.AddOrUpdate<BannerCleanupJob>(
            "banner-cleanup-validate",
            job => job.ExecuteAsync(),
            $"*/{intervalMinutes} * * * *"); // Every 30 minutes
    }
}
