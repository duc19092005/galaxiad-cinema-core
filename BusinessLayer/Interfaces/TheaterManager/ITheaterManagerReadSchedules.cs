using BusinessLayer.Dtos;
using BusinessLayer.Dtos.TheaterManager.MovieSchedules.Responses;

namespace BusinessLayer.Interfaces.TheaterManager;

public interface ITheaterManagerReadSchedules
{
    Task<BaseResponse<List<TheaterManagerMovieScheduleResDto>>> GetSchedulesByAuditoriumId(Guid auditoriumId);
}
