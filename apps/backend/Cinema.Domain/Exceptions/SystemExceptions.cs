using Cinema.Domain.Localization;

namespace Cinema.Domain.Exceptions;

public static class CustomSystemException
{
    public static AppException SystemExceptionCaller()
    {
        return new AppException(Messages.System.GeneralError, 500, "S01");
    }
}
