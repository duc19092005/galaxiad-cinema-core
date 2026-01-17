namespace Backend.Shard.Exceptions;

public static class systemException
{
    public static Exception SystemExceptionCaller()
    {
        throw new appException("There's an error with the system", 500, "S01");
    }
}