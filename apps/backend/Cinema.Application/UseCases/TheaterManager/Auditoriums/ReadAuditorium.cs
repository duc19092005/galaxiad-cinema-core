using System;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.TheaterManager.Auditoriums.Responses;
using Cinema.Application.Interfaces.TheaterManager;
using Cinema.Application.Interfaces;
using Cinema.Application.Exceptions;
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
        Guid userId = GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var getCinemaByUserId = await _repository.GetCinemaWithDetailsByManagerAsync(userId, isAdmin);

        if (getCinemaByUserId == null)
        {
            throw new NotFoundException("Không tìm thấy rạp chiếu phim quản lý bởi người dùng này.");
        }

        var auditoriumLists = await _repository.GetAuditoriumsByCinemaIdAsync(getCinemaByUserId.CinemaId);

        if (!auditoriumLists.Any())
        {
            throw new NotFoundException("Không tìm thấy phòng chiếu nào cho rạp này.");
        }

        TheaterManagerAuditoriumRes res = new TheaterManagerAuditoriumRes()
        {
            CinemaName = getCinemaByUserId.CinemaName,
            CinemaHotLineNumber = getCinemaByUserId.CinemaHotLineNumber,
            CinemaLocation = getCinemaByUserId.CinemaLocation,
            TotalAuditoriums = getCinemaByUserId.AuditoriumInfoEntities.Count,
            TheaterManagerName = getCinemaByUserId.TheaterManager != null 
                ? getCinemaByUserId.TheaterManager.UserName : "Chưa có",
            FacilitiesManagerName = getCinemaByUserId.FacilitiesManager != null 
                ? getCinemaByUserId.FacilitiesManager.UserName : "Chưa có",
            AuditoriumInfosList = auditoriumLists
        };

        return new BaseResponse<TheaterManagerAuditoriumRes>
        {
            Message = Messages.Auditorium.GetCompleted,
            Data = res,
            IsSuccess = true
        };
    }
    
    private Guid GetUserId()
    {
        return _userContextService.GetUserId();
    }
}
