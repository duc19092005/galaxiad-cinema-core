using Cinema.Domain.Localization;

namespace Cinema.Application.Exceptions;

public class UnauthorizeException : AppException
{
    public UnauthorizeException(string? message) : base(!string.IsNullOrEmpty(message) ? message : Messages.Auth.Unauthorized, 401, "AuthE01")
    {
    }
}

public class ForbiddenException : AppException
{
    public ForbiddenException() : base(Messages.Auth.Forbidden, 403, "AuthE01")
    {
    }
}
