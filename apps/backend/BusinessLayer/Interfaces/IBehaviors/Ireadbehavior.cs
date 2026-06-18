using BusinessLayer.Dtos;
namespace BusinessLayer.Interfaces.IBehaviors;

public interface IReadBehavior<TResponse>
{
    Task<BaseResponse<List<TResponse>>> GetAll();

    Task<BaseResponse<TResponse>> GetById(Guid id);
    
    Task<BaseResponse<List<TResponse>>> GetByEntityName(string name);
}
