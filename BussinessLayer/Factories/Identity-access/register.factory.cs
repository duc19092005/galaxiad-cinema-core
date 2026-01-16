using BussinessLayer.Interfaces.i_identity_access;
using DataAccess.Enums;
using Backend.Shard.Exceptions;
using Microsoft.Extensions.DependencyInjection;


namespace BussinessLayer.Factories.Identity_access;

public class registerFactory
{
    private readonly IServiceProvider _serviceProvider;

    public registerFactory(IServiceProvider serviceProvider)
    {
        this._serviceProvider = serviceProvider;
    }
    public IAddBehavior<TRequest, TResponse> Create<TRequest, TResponse>(register_method_enum method)
    {
        switch (method)
        {
            case register_method_enum.UsernamePassword:
                return (IAddBehavior<TRequest, TResponse>)
                    _serviceProvider.GetRequiredService(typeof(IAddBehavior<TRequest, TResponse>));

            default:
                throw new app_exception("Method not supported", 400, "UNSUPPORTED_METHOD");
        }
    }
}