using Backend.Shard.Exceptions;
using BussinessLayer.Interfaces.i_cinema;
using DataAccess.Enums;
using Microsoft.Extensions.DependencyInjection;

namespace BussinessLayer.Factories;

public class readCinemaFactory
{
    private readonly IServiceProvider _IServiceProvider;

    public readCinemaFactory(IServiceProvider _IServiceProvider)
    {
        this._IServiceProvider = _IServiceProvider;
    }

    public ICinemaBehavior<T> ReadDataFromCinemaInfoFactory<T>(write_enum writeEnum)
    {
        if (!Enum.IsDefined(typeof(write_enum), writeEnum))
        {
            throw new app_exception("Method not supported", 400, "UNSUPPORTED_METHOD");
        }
        else
        {
            return (ICinemaBehavior<T>)_IServiceProvider.GetRequiredService(typeof(ICinemaBehavior<T>));
        }
    }
}