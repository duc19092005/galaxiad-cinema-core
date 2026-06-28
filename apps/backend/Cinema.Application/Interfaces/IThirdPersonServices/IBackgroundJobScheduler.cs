using System;
using System.Linq.Expressions;

namespace Cinema.Application.Interfaces.IThirdPersonServices;
public interface IBackgroundJobScheduler
{
    string Enqueue<T>(Expression<Action<T>> methodCall);
    string Schedule<T>(Expression<Action<T>> methodCall, TimeSpan delay);
}
