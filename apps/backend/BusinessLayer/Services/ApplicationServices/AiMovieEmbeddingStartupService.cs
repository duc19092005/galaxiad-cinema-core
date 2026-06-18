using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BusinessLayer.Services.ApplicationServices;

public class AiMovieEmbeddingStartupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AiMovieEmbeddingStartupService> _logger;

    public AiMovieEmbeddingStartupService(
        IServiceProvider serviceProvider,
        ILogger<AiMovieEmbeddingStartupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        for (var attempt = 1; attempt <= 5 && !stoppingToken.IsCancellationRequested; attempt++)
        {
            using var scope = _serviceProvider.CreateScope();
            var syncService = scope.ServiceProvider.GetRequiredService<AiMovieEmbeddingSyncService>();

            var result = await syncService.SyncAllActiveMoviesAsync(stoppingToken);
            if (result.IsSuccess)
            {
                _logger.LogInformation(
                    "AI movie embedding startup sync completed with {MovieCount} movies.",
                    result.MovieCount);
                return;
            }

            _logger.LogWarning(
                "AI movie embedding startup sync attempt {Attempt} failed: {Message}",
                attempt,
                result.Message);

            if (attempt < 5)
            {
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }
    }
}
