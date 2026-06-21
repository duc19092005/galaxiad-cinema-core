namespace Cinema.Application.Exceptions;

public class BadRequestException : AppException
{
    public BadRequestException(string message, string errorCode) : base(message, 400, errorCode)
    {
    }

    public BadRequestException(List<string> errors, string errorCode) : base(errors, 400, errorCode)
    {
    }
}
