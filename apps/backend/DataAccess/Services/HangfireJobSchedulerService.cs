using System;
using System.Linq.Expressions;
using BusinessLayer.Interfaces.IThirdPersonServices;
using Hangfire;

namespace DataAccess.Services;

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
