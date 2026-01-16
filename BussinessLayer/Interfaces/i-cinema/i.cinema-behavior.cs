using BussinessLayer.Dtos;

namespace BussinessLayer.Interfaces.i_cinema;

public interface ICinemaBehavior<T>
{
    Task<base_reponse<List<T>>> GetByCinemaId(Guid id);

    Task<base_reponse<List<T>>> GetByCinemaName(string name);
}