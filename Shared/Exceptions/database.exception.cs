namespace Backend.Shard.Exceptions;

public class system_exception
{
    public static Exception system_exception_caller()
    {
        throw new app_exception("There's an error with the system", 500, "S01");
    }
}