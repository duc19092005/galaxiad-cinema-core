using Cinema.Application.Dtos;

namespace Cinema.Application.Interfaces.IIdentityAccess;

public interface ILogin<TRequest , TResponse>
{
    Task<BaseResponse<TResponse>> Login(TRequest item);
}
