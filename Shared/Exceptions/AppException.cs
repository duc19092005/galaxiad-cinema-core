// ReSharper disable All

namespace Shared.Exceptions;

public class AppException : Exception
{
    public int StatusCode { get; } 
    
    public string ErrorCode { get; }

    public AppException(string message, int statusCode, string errorCode) : base(message)
    {
        this.StatusCode = statusCode;
        this.ErrorCode = errorCode;
    }
}
