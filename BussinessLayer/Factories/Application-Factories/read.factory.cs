// ReSharper disable All

using Backend.Shard.Exceptions;
using BussinessLayer.Interfaces.i_Behaviors;
using DataAccess.Enums;
using Microsoft.Extensions.DependencyInjection;

namespace BussinessLayer.Factories.ApplicationFactories;

public class read_factory
{
    private readonly IServiceProvider _provider;
    public read_factory(IServiceProvider provider)
    {
        _provider = provider;
    }

    public IReadBehavior<TResponse> ReadData<TResponse>(write_enum write_enum)
    {
        switch (write_enum)
        {
            case write_enum.Cinema:
                return (IReadBehavior<TResponse>)_provider.GetRequiredService(typeof(IReadBehavior<TResponse>));
            case write_enum.Auditorium:
                return (IReadBehavior<TResponse>)_provider.GetRequiredService(typeof(IReadBehavior<TResponse>));
            case write_enum.MovieFormat:
                return (IReadBehavior<TResponse>)_provider.GetRequiredService(typeof(IReadBehavior<TResponse>));
            default:
                throw new app_exception("Method not supported", 400, "UNSUPPORTED_METHOD");
        }
    }
}