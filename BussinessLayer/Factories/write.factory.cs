// ReSharper disable All
using Backend.Shard.Exceptions;
using BussinessLayer.Interfaces.i_Behaviors;
using BussinessLayer.Interfaces.i_identity_access;
using DataAccess.Enums;
using Microsoft.Extensions.DependencyInjection;

namespace BussinessLayer.Factories;

public class write_factory
{
    private readonly IServiceProvider _serviceProvider;

    public write_factory(IServiceProvider serviceProvider)
    {
        this._serviceProvider = serviceProvider;
    }
    public IWriteBehavior<TAddRequest, TEditRequest ,TResponse> wirte<TAddRequest, TEditRequest ,TResponse>(write_enum method)
    {
        switch (method)
        {
            case write_enum.Cinema:
                return (IWriteBehavior<TAddRequest, TEditRequest ,TResponse>)
                    _serviceProvider.GetRequiredService(typeof(IWriteBehavior<TAddRequest, TEditRequest ,TResponse>));
            
            case write_enum.Auditorium:
                return (IWriteBehavior<TAddRequest, TEditRequest ,TResponse>)
                    _serviceProvider.GetRequiredService(typeof(IWriteBehavior<TAddRequest, TEditRequest ,TResponse>));
                
            default:
                throw new app_exception("Method not supported", 400, "UNSUPPORTED_METHOD");
        }
    }
}