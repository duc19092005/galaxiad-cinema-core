using BusinessLayer.Dtos;

namespace BusinessLayer.Interfaces.IBehaviors;

public interface IWriteBehavior<TAddRequest , TEditRequest , TResponse>
{
    Task<BaseResponse<TResponse>> AddItem(TAddRequest request);
    
    Task<BaseResponse<TResponse>> UpdateItem(Guid itemId , TEditRequest request);
    
    Task<BaseResponse<TResponse>> DeleteItem(Guid itemId);
}
