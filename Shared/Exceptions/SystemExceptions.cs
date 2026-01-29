namespace Shared.Exceptions;

public static class CustomSystemException
{
    public static Exception SystemExceptionCaller()
    {
        throw new AppException("There's an error with the system", 500, "S01");
    }
}
