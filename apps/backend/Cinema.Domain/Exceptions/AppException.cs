// ReSharper disable All

namespace Cinema.Domain.Exceptions;

public class AppException : Exception
{
    public int StatusCode { get; } 
    
    public string ErrorCode { get; }
    
    public List<string> Errors { get; }

    public AppException(string message, int statusCode, string errorCode) : base(message)
    {
        this.StatusCode = statusCode;
        this.ErrorCode = errorCode;
        this.Errors = new List<string> { message };
    }
    
    public AppException(List<string> errors, int statusCode, string errorCode) : base(errors?.FirstOrDefault() ?? "Multiple errors occurred")
    {
        this.StatusCode = statusCode;
        this.ErrorCode = errorCode;
        this.Errors = errors ?? new List<string>();
    }
    
    public AppException(IEnumerable<string> errors, int statusCode, string errorCode) : base(errors?.FirstOrDefault() ?? "Multiple errors occurred")
    {
        this.StatusCode = statusCode;
        this.ErrorCode = errorCode;
        this.Errors = errors?.ToList() ?? new List<string>();
    }
}
