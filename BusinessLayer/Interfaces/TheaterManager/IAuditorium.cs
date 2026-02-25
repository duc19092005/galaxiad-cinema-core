using BusinessLayer.Dtos;
using BusinessLayer.Dtos.TheaterManager.Auditoriums;

namespace BusinessLayer.Interfaces.TheaterManager;

public interface ITheaterManagerReadAuditorium
{
    Task<BaseResponse<TheaterManagerAuditoriumRes>> GetAuditoriumByCurrentManager();
}