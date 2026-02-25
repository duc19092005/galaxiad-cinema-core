using Shared.Localization;

namespace Shared.Exceptions;

public static class CustomSystemException
{
    public static AppException SystemExceptionCaller()
    {
        return new AppException(Messages.System.GeneralError, 500, "S01");
    }
}
