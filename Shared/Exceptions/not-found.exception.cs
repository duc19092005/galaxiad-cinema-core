using Microsoft.AspNetCore.Http;

namespace Backend.Shard.Exceptions;

public class notFoundException : appException
{
    public notFoundException(string message) : base(message , StatusCodes.Status404NotFound , "NOTFOUND01")
    {
        
    }
}