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
    public i_write_behavior<TAddRequest, TEditRequest ,TResponse> wirte<TAddRequest, TEditRequest ,TResponse>(write_enum method)
    {
        switch (method)
        {
            case write_enum.Cinema:
                return (i_write_behavior<TAddRequest, TEditRequest ,TResponse>)
                    _serviceProvider.GetRequiredService(typeof(i_write_behavior<TAddRequest, TEditRequest ,TResponse>));
            
            case write_enum.Auditorium:
                return (i_write_behavior<TAddRequest, TEditRequest ,TResponse>)
                    _serviceProvider.GetRequiredService(typeof(i_write_behavior<TAddRequest, TEditRequest ,TResponse>));
                
            default:
                throw new app_exception("Method not supported", 400, "UNSUPPORTED_METHOD");
        }
    }
}