// ReSharper disable All

namespace Backend.Exceptions;

public class app_exception : Exception
{
    public int statusCode { get; } 
    
    public string errorCode { get; }

    public app_exception(string message, int statusCode, string errorCode) : base(message)
    {
        this.statusCode = statusCode;
        this.errorCode = errorCode;
    }
}