namespace Cinema.Application.Exceptions;

public class AppException : Exception
{
    public int StatusCode { get; }

    public string ErrorCode { get; }

    public List<string> Errors { get; }

    public AppException(string message, int statusCode, string errorCode) : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
        Errors = new List<string> { message };
    }

    public AppException(List<string> errors, int statusCode, string errorCode) : base(errors?.FirstOrDefault() ?? "Multiple errors occurred")
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
        Errors = errors ?? new List<string>();
    }

    public AppException(IEnumerable<string> errors, int statusCode, string errorCode) : base(errors?.FirstOrDefault() ?? "Multiple errors occurred")
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
        Errors = errors?.ToList() ?? new List<string>();
    }
}
