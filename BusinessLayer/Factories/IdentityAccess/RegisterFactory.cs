using BusinessLayer.Interfaces.IIdentityAccess;
using Shared.Enums;
using Shared.Exceptions;
using Microsoft.Extensions.DependencyInjection;


namespace BusinessLayer.Factories.IdentityAccess;

public class RegisterFactory
{
    private readonly IServiceProvider _serviceProvider;

    public RegisterFactory(IServiceProvider serviceProvider)
    {
        this._serviceProvider = serviceProvider;
    }
    public IAddBehavior<TRequest, TResponse> Create<TRequest, TResponse>(RegisterMethodEnum method)
    {
        switch (method)
        {
            case RegisterMethodEnum.UsernamePassword:
                return (IAddBehavior<TRequest, TResponse>)
                    _serviceProvider.GetRequiredService(typeof(IAddBehavior<TRequest, TResponse>));

            default:
                throw new AppException("Method not supported", 400, "UNSUPPORTED_METHOD");
        }
    }
}

