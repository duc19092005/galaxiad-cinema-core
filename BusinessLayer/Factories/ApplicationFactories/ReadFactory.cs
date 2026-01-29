
using Shared.Exceptions;
using Shared.Enums;
using BusinessLayer.Interfaces.IBehaviors;
using Microsoft.Extensions.DependencyInjection;

namespace BusinessLayer.Factories.ApplicationFactories;

public class ReadFactory
{
    private readonly IServiceProvider _provider;
    public ReadFactory(IServiceProvider provider)
    {
        _provider = provider;
    }

    public IReadBehavior<TResponse> ReadData<TResponse>(WriteEnum write_enum)
    {
        if (!Enum.IsDefined(typeof(WriteEnum), write_enum))
        {
            throw new AppException("Method not supported", 400, "UNSUPPORTED_METHOD");
        }
        return (IReadBehavior<TResponse>)_provider.GetRequiredService(typeof(IReadBehavior<TResponse>));
    }
}
