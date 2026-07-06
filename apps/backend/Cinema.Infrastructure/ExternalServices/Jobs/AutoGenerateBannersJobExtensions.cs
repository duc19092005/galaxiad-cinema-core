using Cinema.Infrastructure.BackgroundJobs.Banners;
using Hangfire;

namespace Cinema.Infrastructure.ExternalServices.Jobs;

public static class AutoGenerateBannersJobExtensions
{
    /// <summary>
    /// Registers the auto-generate banners job.
    /// Runs on startup (BackgroundJob.Enqueue) and then every 6 hours as safety net.
    /// </summary>
    public static void AddAutoGenerateBannersJob(
        this IRecurringJobManager recurringJobManager,
        IBackgroundJobClient backgroundJobClient)
    {
        // Run immediately on startup
        backgroundJobClient.Enqueue<AutoGenerateBannersJob>(job => job.ExecuteAsync());

        // Then every 6 hours (safety net for new cinemas added later)
        recurringJobManager.AddOrUpdate<AutoGenerateBannersJob>(
            "auto-generate-banners",
            job => job.ExecuteAsync(),
            "0 */6 * * *"); // Every 6 hours
    }
}
