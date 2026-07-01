using System.Collections.Concurrent;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.UseCases.Booking.SocialBooking;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Infrastructure.ExternalServices.Cache;

public class VoteTimeoutScheduler : IVoteTimeoutScheduler, IDisposable
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<VoteTimeoutScheduler> _logger;
    private readonly ConcurrentDictionary<Guid, Timer> _timers = new();

    public VoteTimeoutScheduler(
        IServiceScopeFactory scopeFactory,
        ILogger<VoteTimeoutScheduler> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public void Schedule(Guid groupSessionId, DateTime endTimeUtc)
    {
        var dueTime = endTimeUtc - DateTime.UtcNow;
        if (dueTime < TimeSpan.Zero)
        {
            dueTime = TimeSpan.Zero;
        }

        Cancel(groupSessionId);

        var timer = new Timer(
            _ => _ = ResolveExpiredVoteAsync(groupSessionId),
            null,
            dueTime,
            Timeout.InfiniteTimeSpan);

        _timers[groupSessionId] = timer;
    }

    public void Cancel(Guid groupSessionId)
    {
        if (_timers.TryRemove(groupSessionId, out var timer))
        {
            timer.Dispose();
        }
    }

    private async Task ResolveExpiredVoteAsync(Guid groupSessionId)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var repo = scope.ServiceProvider.GetRequiredService<IGroupBookingRepository>();
            var session = await repo.GetSessionByIdAsync(groupSessionId);
            if (session == null) return;

            bool resolved = false;
            if (session.Status == GroupBookingStatusEnum.VotingPaymentMethod)
            {
                var useCase = scope.ServiceProvider.GetRequiredService<VotePaymentMethodUseCase>();
                resolved = await useCase.ResolveTimeoutAsync(groupSessionId);
            }
            else if (session.Status == GroupBookingStatusEnum.PaymentFailedPartial)
            {
                var useCase = scope.ServiceProvider.GetRequiredService<VotePaymentFailureUseCase>();
                resolved = await useCase.ResolveFailureTimeoutAsync(groupSessionId);
            }

            if (resolved)
            {
                var groupStateUseCase = scope.ServiceProvider.GetRequiredService<GetGroupBookingStateUseCase>();
                var notification = scope.ServiceProvider.GetRequiredService<ISeatLockerNotificationService>();
                var state = await groupStateUseCase.ExecuteAsync(groupSessionId);
                if (state.IsSuccess && state.Data != null)
                {
                    await notification.NotifyGroupUpdateAsync(groupSessionId, state.Data);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to resolve vote timeout for group {GroupSessionId}.", groupSessionId);
        }
        finally
        {
            Cancel(groupSessionId);
        }
    }

    public void Dispose()
    {
        foreach (var timer in _timers.Values)
        {
            timer.Dispose();
        }
        _timers.Clear();
    }
}
