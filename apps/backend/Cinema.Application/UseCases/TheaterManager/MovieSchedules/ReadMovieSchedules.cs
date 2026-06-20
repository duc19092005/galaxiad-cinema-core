using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.TheaterManager.MovieSchedules.Responses;
using Cinema.Application.Interfaces.TheaterManager;
using Cinema.Application.Interfaces;
using Cinema.Domain.Exceptions;
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
        var getCurrentUserId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");
        
        // Ensure auditorium belongs to a cinema this manager manages
        var validAuditorium = await _repository.GetAuditoriumWithCinemaAsync(auditoriumId);

        if (validAuditorium == null)
        {
            throw new NotFoundException(Messages.Schedule.AuditoriumNotFound);
        }

        if (!isAdmin && validAuditorium.CinemaInfoEntity.TheaterManagerId != getCurrentUserId && 
            validAuditorium.CinemaInfoEntity.FacilitiesManagerId != getCurrentUserId)
        {
            throw new BadRequestException("Bạn không có quyền xem thông tin của rạp này.", "E01");
        }

        var schedules = await _repository.GetSchedulesByAuditoriumIdAsync(auditoriumId);

        return new BaseResponse<List<TheaterManagerMovieScheduleResDto>>()
        {
            Message = "Lấy danh sách lịch chiếu thành công.",
            Data = schedules,
            IsSuccess = true
        };
    }
}
