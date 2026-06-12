using Shared.Exceptions;
using Shared.Localization;
using BusinessLayer.Interfaces.IBehaviors;
using BusinessLayer.Interfaces.IIdentityAccess;
using Shared.Enums;
using Microsoft.Extensions.DependencyInjection;

namespace BusinessLayer.Factories.ApplicationFactories;

public class WriteFactory
{
    private readonly IServiceProvider _serviceProvider;

    public WriteFactory(IServiceProvider serviceProvider)
    {
        this._serviceProvider = serviceProvider;
    }

    public IWriteBehavior<TAddRequest, TEditRequest, TResponse> Write<TAddRequest, TEditRequest, TResponse>(
        WriteEnum method)
    {
        if (!Enum.IsDefined(typeof(WriteEnum), method))
        {
            throw new AppException(Messages.System.MethodNotSupported, 400, "UNSUPPORTED_METHOD");
        }

        return (IWriteBehavior<TAddRequest, TEditRequest, TResponse>)_serviceProvider.GetRequiredService(
            typeof(IWriteBehavior<TAddRequest, TEditRequest, TResponse>));
    }
}

