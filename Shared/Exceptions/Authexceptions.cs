namespace Shared.Exceptions;

public class UnauthorizeException : AppException
{
    public UnauthorizeException() : base("Unauthorize" , 401 , "AuthE01")
    {
        
    }
}

public class ForbiddenException : AppException
{
    public ForbiddenException() : base("You Don't Have Right To Access This Resources", 403, "AuthE01")
    {
        
    }
}
