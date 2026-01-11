using BussinessLayer.Dtos;
// ReSharper disable All

namespace BussinessLayer.Interfaces;

public interface IAddBehavior<TRequest, TResponse>
{
    Task<base_reponse<TResponse>> Add(TRequest item);
}