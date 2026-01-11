using BussinessLayer.Dtos;

namespace BussinessLayer.Interfaces.i_identity_access;

public interface ILogin_interface<TRequest , TResponse>
{
    Task<base_reponse<TResponse>> Login(TRequest item);
}