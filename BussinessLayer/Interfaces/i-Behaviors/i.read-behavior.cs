using BussinessLayer.Dtos;
// ReSharper disable All
namespace BussinessLayer.Interfaces.i_Behaviors;

public interface i_read_behavior<TResponse>
{
    Task<base_reponse<List<TResponse>>> getAll();

    Task<base_reponse<TResponse>> getById(Guid id);
    
    Task<base_reponse<List<TResponse>>> getByEntityName(string name);
}