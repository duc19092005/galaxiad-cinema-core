using System;
using System.Linq.Expressions;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Hangfire;

namespace Cinema.Infrastructure.Services;

public class HangfireJobSchedulerService : IBackgroundJobScheduler
{
    private readonly IBackgroundJobClient _backgroundJobClient;

    public HangfireJobSchedulerService(IBackgroundJobClient backgroundJobClient)
    {
        _backgroundJobClient = backgroundJobClient;
    }

    public string Enqueue<T>(Expression<Action<T>> methodCall)
    {
        return _backgroundJobClient.Enqueue<T>(methodCall);
    }
}
