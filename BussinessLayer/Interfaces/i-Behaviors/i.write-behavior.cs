// ReSharper disable All
using BussinessLayer.Dtos;

namespace BussinessLayer.Interfaces.i_Behaviors;

public interface i_write_behavior<TRequest, TResponse>
{
    Task<base_reponse<TResponse>> AddItem(TRequest request);
    
    Task<base_reponse<TResponse>> UpdateItem(Guid itemId , TRequest request);
    
    Task<base_reponse<TResponse>> DeleteItem(Guid itemId);
}