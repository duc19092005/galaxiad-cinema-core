using Shared.Exceptions;
using Shared.Localization;
using BusinessLayer.Interfaces.ICinema;
using Shared.Enums;
using Microsoft.Extensions.DependencyInjection;

namespace BusinessLayer.Factories;

public class ReadDataFromCinemaFactory
{
    private readonly IServiceProvider _serviceProvider;

    public ReadDataFromCinemaFactory(IServiceProvider serviceProvider)
    {
        this._serviceProvider = serviceProvider;
    }

    public ICinemaBehavior<T> ReadDataFromCinemaInfoFactory<T>(WriteEnum writeEnum)
    {
        if (!Enum.IsDefined(typeof(WriteEnum), writeEnum))
        {
            throw new AppException(Messages.System.MethodNotSupported, 400, "UNSUPPORTED_METHOD");
        }
        else
        {
            return (ICinemaBehavior<T>)_serviceProvider.GetRequiredService(typeof(ICinemaBehavior<T>));
        }
    }
}


