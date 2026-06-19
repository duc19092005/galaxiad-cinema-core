using Cinema.Domain.Localization;

namespace Cinema.Domain.Exceptions;

public class UnauthorizeException : AppException
{
    public UnauthorizeException(string? message) : base(!String.IsNullOrEmpty(message) ? message : Messages.Auth.Unauthorized , 401 , "AuthE01")
    {
        
    }
}

public class ForbiddenException : AppException
{
    public ForbiddenException() : base(Messages.Auth.Forbidden, 403, "AuthE01")
    {
        
    }
}
