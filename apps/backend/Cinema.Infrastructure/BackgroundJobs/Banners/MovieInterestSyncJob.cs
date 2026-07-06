using System;
using System.Threading.Tasks;
using Cinema.Infrastructure.ExternalServices.Cache;
using Microsoft.Extensions.Logging;

namespace Cinema.Infrastructure.BackgroundJobs.Banners;

/// <summary>
/// Hangfire recurring job that syncs movie interest counts from Redis to DB.
/// Runs every 10 minutes.
/// </summary>
public class MovieInterestSyncJob
{
    private readonly IMovieInterestBuffer _interestBuffer;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MovieInterestSyncJob> _logger;

    public MovieInterestSyncJob(
        IMovieInterestBuffer interestBuffer,
        IServiceProvider serviceProvider,
        ILogger<MovieInterestSyncJob> logger)
    {
        _interestBuffer = interestBuffer;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        try
        {
            await _interestBuffer.SyncToDbAsync(_serviceProvider);
            _logger.LogInformation("MovieInterestSync: Synced interest counts from Redis to DB");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "MovieInterestSync: Error syncing interest counts");
            throw;
        }
    }
}
