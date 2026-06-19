using Cinema.Application.Dtos;

namespace Cinema.Application.Interfaces.IIdentityAccess;

public interface IAddBehavior<TRequest, TResponse>
{
    Task<BaseResponse<TResponse>> Add(TRequest item);
}
