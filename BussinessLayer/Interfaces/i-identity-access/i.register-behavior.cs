using BussinessLayer.Dtos;
// ReSharper disable All

namespace BussinessLayer.Interfaces.i_identity_access;

public interface IAddBehavior<TRequest, TResponse>
{
    Task<base_reponse<TResponse>> Add(TRequest item);
}