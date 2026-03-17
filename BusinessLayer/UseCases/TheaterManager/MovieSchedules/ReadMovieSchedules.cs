using BusinessLayer.Dtos;
using BusinessLayer.Dtos.TheaterManager.MovieSchedules.Responses;
using BusinessLayer.Interfaces.TheaterManager;
using BusinessLayer.Services.IdentityAccess;
using DataAccess;
using Microsoft.EntityFrameworkCore;
using Shared.Exceptions;
using Shared.Localization;

namespace BusinessLayer.UseCases.TheaterManager.MovieSchedules;

public class ReadMovieSchedules : ITheaterManagerReadSchedules
{
    private readonly CinemaDbContext _cinemaDbContext;
    private readonly IUserContextService _userContextService;

    public ReadMovieSchedules(CinemaDbContext dbContext, IUserContextService userContextService)
    {
        _cinemaDbContext = dbContext;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<List<TheaterManagerMovieScheduleResDto>>> GetSchedulesByAuditoriumId(Guid auditoriumId)
    {
        var getCurrentUserId = _userContextService.GetUserId();
        
        // Ensure auditorium belongs to a cinema this manager manages
        var validAuditorium = await _cinemaDbContext.AuditoriumInfoEntities
            .Include(x => x.CinemaInfoEntity)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.AuditoriumId == auditoriumId);

        if (validAuditorium == null)
        {
            throw new NotFoundException(Messages.Schedule.AuditoriumNotFound);
        }

        if (validAuditorium.CinemaInfoEntity.TheaterManagerId != getCurrentUserId && 
            validAuditorium.CinemaInfoEntity.FacilitiesManagerId != getCurrentUserId)
        {
            throw new BadRequestException("Bạn không có quyền xem thông tin của rạp này.", "E01");
        }

        var schedules = await _cinemaDbContext.MovieScheduleInfoEntity
            .AsNoTracking()
            .Include(x => x.MovieInfoEntity)
            .Include(x => x.MovieFormatInfoEntity)
            .Where(x => x.AuditoriumId == auditoriumId)
            .Select(x => new TheaterManagerMovieScheduleResDto
            {
                ScheduleId = x.MovieScheduleInfoId,
                MovieId = x.MovieId,
                MovieName = x.MovieInfoEntity.MovieName,
                FormatId = x.MovieFormatId,
                FormatName = x.MovieFormatInfoEntity.MovieFormatName,
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
