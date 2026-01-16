using BussinessLayer.Dtos;

namespace BussinessLayer.Interfaces.i_identity_access;

public interface ILogin_interface<TRequest , TResponse>
{
    Task<baseResponse<TResponse>> Login(TRequest item);
}