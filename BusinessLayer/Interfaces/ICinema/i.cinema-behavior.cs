using BussinessLayer.Dtos;

namespace BussinessLayer.Interfaces.i_cinema;

public interface ICinemaBehavior<T>
{
    TasBaseResponsese<List<T>>> GetByCinemaId(Guid id);

    TasBaseResponsese<List<T>>> GetByCinemaName(string name);
}