using BussinessLayer.Dtos;

namespace BussinessLayer.Interfaces.i_Behaviors;

public interface IWriteBehavior<TAddRequest , TEditRequest , TResponse>
{
    Task<base_reponse<TResponse>> AddItem(TAddRequest request);
    
    Task<base_reponse<TResponse>> UpdateItem(Guid itemId , TEditRequest request);
    
    Task<base_reponse<TResponse>> DeleteItem(Guid itemId);
}