using BusinessLayer.Dtos;

namespace BusinessLayer.Interfaces.IIdentityAccess;

public interface ILogin<TRequest , TResponse>
{
    Task<BaseResponse<TResponse>> Login(TRequest item);
}
