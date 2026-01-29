namespace Backend.Shard.Exceptions;

public class badRequestException : appException
{
    public badRequestException(string message , string errorCode) : base(message , 404 , errorCode)
    {
        
    }
}