using BusinessLayer.Dtos;
using BusinessLayer.Dtos.TheaterManager.Auditoriums.Responses;

namespace BusinessLayer.Interfaces.TheaterManager;

public interface ITheaterManagerReadAuditorium
{
    Task<BaseResponse<TheaterManagerAuditoriumRes>> GetAuditoriumByCurrentManager();
}