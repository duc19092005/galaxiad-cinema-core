using BussinessLayer.Dtos;
namespace BussinessLayer.Interfaces.i_Behaviors;

public interface IReadBehavior<TResponse>
{
    Task<base_reponse<List<TResponse>>> GetAll();

    Task<base_reponse<TResponse>> GetById(Guid id);
    
    Task<base_reponse<List<TResponse>>> GetByEntityName(string name);
}