using Cinema.Application.Dtos;
using Cinema.Application.Dtos.TheaterManager.MovieSchedules.Responses;

namespace Cinema.Application.Interfaces.TheaterManager;

public interface ITheaterManagerReadSchedules
{
    Task<BaseResponse<List<TheaterManagerMovieScheduleResDto>>> GetSchedulesByAuditoriumId(Guid auditoriumId);
}
