using Cinema.Infrastructure.BackgroundJobs.Banners;
using Hangfire;

namespace Cinema.Infrastructure.ExternalServices.Jobs;

public static class MovieInterestSyncJobExtensions
{
    public static void AddMovieInterestSyncRecurringJob(
        this IRecurringJobManager recurringJobManager,
        int intervalMinutes = 10)
    {
        recurringJobManager.AddOrUpdate<MovieInterestSyncJob>(
            "movie-interest-sync",
            job => job.ExecuteAsync(),
            $"*/{intervalMinutes} * * * *");
    }
}
