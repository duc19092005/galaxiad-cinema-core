using BusinessLayer.Dtos;

namespace BusinessLayer.Interfaces.IIdentityAccess;

public interface IAddBehavior<TRequest, TResponse>
{
    Task<BaseResponse<TResponse>> Add(TRequest item);
}
