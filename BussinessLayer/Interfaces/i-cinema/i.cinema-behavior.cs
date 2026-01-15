using BussinessLayer.Dtos;

namespace BussinessLayer.Interfaces.i_cinema;

public interface i_cinema_behavior<T>
{
    Task<base_reponse<T>> getByCinemaId(Guid id);

    Task<base_reponse<T>> getByCinemaName(string name);
}