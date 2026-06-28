using Cinema.Application.Dtos;
using Cinema.Application.Dtos.TheaterManager.Auditoriums.Responses;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.TheaterManager;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager.Auditoriums;

public class ReadAuditorium : ITheaterManagerReadAuditorium
{
    private readonly IMovieScheduleRepository _repository;
    private readonly IUserContextService _userContextService;

    public ReadAuditorium(IMovieScheduleRepository repository, IUserContextService userContextService)
    {
        _repository = repository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<TheaterManagerAuditoriumRes>> GetAuditoriumByCurrentManager()
    {
        var userId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");
        var cinema = await _repository.GetCinemaWithDetailsByManagerAsync(userId, isAdmin);

        if (cinema == null)
        {
            throw new NotFoundException(Messages.Cinema.NotFound);
        }

        var auditoriums = await _repository.GetAuditoriumsByCinemaIdAsync(cinema.CinemaId);
        if (!auditoriums.Any())
        {
            throw new NotFoundException(Messages.Auditorium.NotFound);
        }

        var response = new TheaterManagerAuditoriumRes
        {
            CinemaName = cinema.CinemaName,
            CinemaHotLineNumber = cinema.CinemaHotLineNumber,
            CinemaLocation = cinema.CinemaLocation,
            TotalAuditoriums = cinema.AuditoriumInfoEntities.Count,
            TheaterManagerName = cinema.TheaterManager?.UserName ?? "Not assigned",
            FacilitiesManagerName = cinema.FacilitiesManager?.UserName ?? "Not assigned",
            AuditoriumInfosList = auditoriums
        };

        return new BaseResponse<TheaterManagerAuditoriumRes>
        {
            Message = Messages.Auditorium.GetCompleted,
            Data = response,
            IsSuccess = true
        };
    }
}
