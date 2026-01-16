using BussinessLayer.Dtos;

namespace BussinessLayer.Interfaces.i_cinema;

public interface ICinemaBehavior<T>
{
    Task<baseResponse<List<T>>> GetByCinemaId(Guid id);

    Task<baseResponse<List<T>>> GetByCinemaName(string name);
}