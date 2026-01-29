using Backend.Shard.Exceptions;
using BussinessLayer.Interfaces.i_Behaviors;
using BussinessLayer.Interfaces.i_identity_access;
using DataAccess.Enums;
using Microsoft.Extensions.DependencyInjection;

namespace BussinessLayer.Factories.Application_Factories;

public class WriteFactory
{
    private readonly IServiceProvider _serviceProvider;

    public WriteFactory(IServiceProvider serviceProvider)
    {
        this._serviceProvider = serviceProvider;
    }
    public IWriteBehavior<TAddRequest, TEditRequest ,TResponse> wirte<TAddRequest, TEditRequest ,TResponse>(write_enum method)
    {
        if (!Enum.IsDefined(typeof(write_enum), method))
        {
            throw new appException("Method not supported", 400, "UNSUPPORTED_METHOD");
        }
        return (IWriteBehavior<TAddRequest, TEditRequest ,TResponse>)_serviceProvider.GetRequiredService(typeof(IWriteBehavior<TAddRequest, TEditRequest ,TResponse>));
    }
}