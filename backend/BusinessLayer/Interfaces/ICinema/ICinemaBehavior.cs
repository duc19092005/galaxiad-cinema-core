using BusinessLayer.Dtos;

namespace BusinessLayer.Interfaces.ICinema;

public interface ICinemaBehavior<T>
{
    Task<BaseResponse<List<T>>> GetByCinemaId(Guid id);

    Task<BaseResponse<List<T>>> GetByCinemaName(string name);
}
