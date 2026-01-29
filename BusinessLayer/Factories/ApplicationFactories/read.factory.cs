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
        if (!Enum.IsDefined(typeof(write_enum), write_enum))
        {
            throw new appException("Method not supported", 400, "UNSUPPORTED_METHOD");
        }
        return (IReadBehavior<TResponse>)_provider.GetRequiredService(typeof(IReadBehavior<TResponse>));
    }
}