using Cinema.Application.Interfaces.Booking;
using Cinema.Application.UseCases.Booking.SocialBooking;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Cinema.Infrastructure.BackgroundJobs;

public class VoteTimerBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<VoteTimerBackgroundService> _logger;

    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(15);

    public VoteTimerBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<VoteTimerBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("VoteTimerBackgroundService starting...");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(PollInterval, stoppingToken);
                await ResolveExpiredVotesAsync();
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Vote cleanup error.");
            }
        }
    }

    private async Task ResolveExpiredVotesAsync()
    {
        using var scope = _serviceProvider.CreateScope();

        var repository = scope.ServiceProvider.GetRequiredService<IGroupBookingRepository>();
        var cache = scope.ServiceProvider.GetRequiredService<IGroupBookingCacheService>();
        var votePaymentMethodUseCase = scope.ServiceProvider.GetRequiredService<VotePaymentMethodUseCase>();
        var groupStateUseCase = scope.ServiceProvider.GetRequiredService<GetGroupBookingStateUseCase>();
        var notification = scope.ServiceProvider.GetRequiredService<ISeatLockerNotificationService>();

        var votingSessions = await repository.GetVotingSessionsAsync();
        foreach (var session in votingSessions)
        {
            var endTime = await cache.GetVoteEndTimeAsync(session.GroupSessionId);
            if (endTime.HasValue && endTime.Value <= DateTime.UtcNow)
            {
                var resolved = await votePaymentMethodUseCase.ResolveTimeoutAsync(session.GroupSessionId);
                if (resolved)
                {
                    var state = await groupStateUseCase.ExecuteAsync(session.GroupSessionId);
                    if (state.IsSuccess && state.Data != null)
                    {
                        await notification.NotifyGroupUpdateAsync(session.GroupSessionId, state.Data);
                    }
                }
            }
        }
    }
}
