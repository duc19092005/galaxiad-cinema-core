using BusinessLayer.Dtos;
using BusinessLayer.Dtos.TheaterManager.MovieSchedules.Responses;
using BusinessLayer.Interfaces.TheaterManager;

namespace BusinessLayer.Services.TheaterManager.MovieSchedules;

public class TheaterManagerReadSchedulesService
{
    private readonly ITheaterManagerReadSchedules _theaterManagerReadSchedules;

    public TheaterManagerReadSchedulesService(ITheaterManagerReadSchedules theaterManagerReadSchedules)
    {
        _theaterManagerReadSchedules = theaterManagerReadSchedules;
    }

    public async Task<BaseResponse<List<TheaterManagerMovieScheduleResDto>>> GetSchedulesByAuditoriumId(Guid auditoriumId)
    {
        return await _theaterManagerReadSchedules.GetSchedulesByAuditoriumId(auditoriumId);
    }
}
