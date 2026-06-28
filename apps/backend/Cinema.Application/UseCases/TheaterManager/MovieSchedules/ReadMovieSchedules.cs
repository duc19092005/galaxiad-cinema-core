using Cinema.Application.Dtos;
using Cinema.Application.Dtos.TheaterManager.MovieSchedules.Responses;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.TheaterManager;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager.MovieSchedules;

public class ReadMovieSchedules : ITheaterManagerReadSchedules
{
    private readonly IMovieScheduleRepository _repository;
    private readonly IUserContextService _userContextService;

    public ReadMovieSchedules(IMovieScheduleRepository repository, IUserContextService userContextService)
    {
        _repository = repository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<List<TheaterManagerMovieScheduleResDto>>> GetSchedulesByAuditoriumId(Guid auditoriumId)
    {
        var currentUserId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");
        var auditorium = await _repository.GetAuditoriumWithCinemaAsync(auditoriumId);

        if (auditorium == null)
        {
            throw new NotFoundException(Messages.Schedule.AuditoriumNotFound);
        }

        if (!isAdmin &&
            auditorium.CinemaInfoEntity.TheaterManagerId != currentUserId &&
            auditorium.CinemaInfoEntity.FacilitiesManagerId != currentUserId)
        {
            throw new BadRequestException(Messages.Schedule.NoPermissionCinemaView, "E01");
        }

        var schedules = await _repository.GetSchedulesByAuditoriumIdAsync(auditoriumId);

        return new BaseResponse<List<TheaterManagerMovieScheduleResDto>>
        {
            Message = Messages.Schedule.MovieScheduleListRetrieved,
            Data = schedules,
            IsSuccess = true
        };
    }
}
