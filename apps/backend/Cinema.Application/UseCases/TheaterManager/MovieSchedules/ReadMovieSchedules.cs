using Cinema.Application.Dtos;
using Cinema.Application.Dtos.TheaterManager.MovieSchedules.Responses;
using Cinema.Application.Interfaces.TheaterManager;
using Cinema.Application.Interfaces;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager.MovieSchedules;

public class ReadMovieSchedules : ITheaterManagerReadSchedules
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserContextService _userContextService;

    public ReadMovieSchedules(IUnitOfWork unitOfWork, IUserContextService userContextService)
    {
        _unitOfWork = unitOfWork;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<List<TheaterManagerMovieScheduleResDto>>> GetSchedulesByAuditoriumId(Guid auditoriumId)
    {
        var getCurrentUserId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");
        
        // Ensure auditorium belongs to a cinema this manager manages
        var validAuditorium = await _unitOfWork.Repository<AuditoriumInfoEntities>().Query()
            .Include(x => x.CinemaInfoEntity)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.AuditoriumId == auditoriumId);

        if (validAuditorium == null)
        {
            throw new NotFoundException(Messages.Schedule.AuditoriumNotFound);
        }

        if (!isAdmin && validAuditorium.CinemaInfoEntity.TheaterManagerId != getCurrentUserId && 
            validAuditorium.CinemaInfoEntity.FacilitiesManagerId != getCurrentUserId)
        {
            throw new BadRequestException("Bạn không có quyền xem thông tin của rạp này.", "E01");
        }

        var schedules = await _unitOfWork.Repository<MovieScheduleInfoEntity>().Query()
            .AsNoTracking()
            .Include(x => x.MovieInfoEntity)
            .Include(x => x.MovieFormatInfoEntity)
            .Where(x => x.AuditoriumId == auditoriumId)
            .Select(x => new TheaterManagerMovieScheduleResDto
            {
                ScheduleId = x.MovieScheduleInfoId,
                MovieId = x.MovieId,
                MovieName = x.MovieInfoEntity!.MovieName,
                FormatId = x.MovieFormatId,
                FormatName = x.MovieFormatInfoEntity!.MovieFormatName,
                AuditoriumId = x.AuditoriumId,
                StartedDate = x.ActiveAt,
                EndedTime = x.EndedTime,
                IsDeleted = x.IsDeleted
            })
            .OrderBy(x => x.StartedDate)
            .ToListAsync();

        return new BaseResponse<List<TheaterManagerMovieScheduleResDto>>()
        {
            Message = "Lấy danh sách lịch chiếu thành công.",
            Data = schedules,
            IsSuccess = true
        };
    }
}
