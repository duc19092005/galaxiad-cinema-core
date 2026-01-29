using BussinessLayer.Dtos;
namespace BussinessLayer.Interfaces.i_Behaviors;

public interface IReadBehavior<TResponse>
{
    Task<baseResponse<List<TResponse>>> GetAll();

    Task<baseResponse<TResponse>> GetById(Guid id);
    
    Task<baseResponse<List<TResponse>>> GetByEntityName(string name);
}