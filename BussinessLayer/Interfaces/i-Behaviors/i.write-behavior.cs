using BussinessLayer.Dtos;

namespace BussinessLayer.Interfaces.i_Behaviors;

public interface IWriteBehavior<TAddRequest , TEditRequest , TResponse>
{
    Task<baseResponse<TResponse>> AddItem(TAddRequest request);
    
    Task<baseResponse<TResponse>> UpdateItem(Guid itemId , TEditRequest request);
    
    Task<baseResponse<TResponse>> DeleteItem(Guid itemId);
}