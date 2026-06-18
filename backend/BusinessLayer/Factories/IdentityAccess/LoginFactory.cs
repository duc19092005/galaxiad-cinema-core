using Shared.Enums;
using Shared.Exceptions;
using Shared.Localization;
using BusinessLayer.Interfaces.IIdentityAccess;
using Microsoft.Extensions.DependencyInjection;


namespace BusinessLayer.Factories.IdentityAccess;

public class LoginFactory
{
    private readonly IServiceProvider _serviceProvider;

    public LoginFactory(IServiceProvider serviceProvider)
    {
        this._serviceProvider = serviceProvider;
    }
    public ILogin<TRequest, TResponse> Login<TRequest, TResponse>(RegisterMethodEnum method)
    {
        switch (method)
        {
            case RegisterMethodEnum.UsernamePassword:
                return (ILogin<TRequest, TResponse>)
                    _serviceProvider.GetRequiredService(typeof(ILogin<TRequest, TResponse>));

            default:
                throw new AppException(Messages.System.MethodNotSupported, 400, "UNSUPPORTED_METHOD");
        }
    }
}


