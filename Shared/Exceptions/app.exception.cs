// ReSharper disable All

namespace Backend.Shard.Exceptions;

public class appException : Exception
{
    public int statusCode { get; } 
    
    public string errorCode { get; }

    public appException(string message, int statusCode, string errorCode) : base(message)
    {
        this.statusCode = statusCode;
        this.errorCode = errorCode;
    }
}