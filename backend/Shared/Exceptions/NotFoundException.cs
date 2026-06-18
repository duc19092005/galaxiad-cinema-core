using Microsoft.AspNetCore.Http;

namespace Shared.Exceptions;

public class NotFoundException : AppException
{
    public NotFoundException(string message) : base(message , StatusCodes.Status404NotFound , "NOTFOUND01")
    {
        
    }
}
