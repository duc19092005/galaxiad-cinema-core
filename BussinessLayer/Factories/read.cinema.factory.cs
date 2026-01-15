using Backend.Shard.Exceptions;
using BussinessLayer.Interfaces.i_cinema;
using DataAccess.Enums;
using Microsoft.Extensions.DependencyInjection;

namespace BussinessLayer.Factories;

public class read_cinema_factory
{
    private readonly IServiceProvider _IServiceProvider;

    public read_cinema_factory(IServiceProvider _IServiceProvider)
    {
        this._IServiceProvider = _IServiceProvider;
    }

    public i_cinema_behavior<T> readDataFromCinemaInfoFactory<T>(write_enum writeEnum)
    {
        if (Enum.IsDefined(typeof(write_enum), writeEnum))
        {
            throw new app_exception("Method not supported", 400, "UNSUPPORTED_METHOD");
        }
        else
        {
            return (i_cinema_behavior<T>)_IServiceProvider.GetRequiredService(typeof(i_cinema_behavior<T>));
        }
    }
}