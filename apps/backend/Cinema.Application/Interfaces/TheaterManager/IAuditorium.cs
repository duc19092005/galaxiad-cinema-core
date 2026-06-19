using Cinema.Application.Dtos;
using Cinema.Application.Dtos.TheaterManager.Auditoriums.Responses;

namespace Cinema.Application.Interfaces.TheaterManager;

public interface ITheaterManagerReadAuditorium
{
    Task<BaseResponse<TheaterManagerAuditoriumRes>> GetAuditoriumByCurrentManager();
}