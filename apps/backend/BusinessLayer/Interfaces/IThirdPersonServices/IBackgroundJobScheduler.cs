using System;
using System.Linq.Expressions;

namespace BusinessLayer.Interfaces.IThirdPersonServices;

public interface IBackgroundJobScheduler
{
    string Enqueue<T>(Expression<Action<T>> methodCall);
}
