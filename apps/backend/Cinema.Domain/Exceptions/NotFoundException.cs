namespace Cinema.Domain.Exceptions;

public class NotFoundException : AppException
{
    public NotFoundException(string message) : base(message , 404 , "NOTFOUND01")
    {
        
    }
}
