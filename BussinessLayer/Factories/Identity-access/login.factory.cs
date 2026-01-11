using System.Reflection;
using BussinessLayer.Interfaces;
using BussinessLayer.Use_cases.Identity_access;
using DataAccess.Enums;
using Backend.Shard.Exceptions;
using BussinessLayer.Interfaces.i_identity_access;
using DataAccess;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;


namespace BussinessLayer.Factories.Identity_access;

public class login_factory
{
    private readonly IServiceProvider _serviceProvider;

    public login_factory(IServiceProvider serviceProvider)
    {
        this._serviceProvider = serviceProvider;
    }
    public ILogin_interface<TRequest, TResponse> Login<TRequest, TResponse>(register_method_enum method)
    {
        switch (method)
        {
            case register_method_enum.UsernamePassword:
                return (ILogin_interface<TRequest, TResponse>)
                    _serviceProvider.GetRequiredService(typeof(ILogin_interface<TRequest, TResponse>));

            default:
                throw new app_exception("Method not supported", 400, "UNSUPPORTED_METHOD");
        }
    }
}