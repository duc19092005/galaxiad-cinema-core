using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.TheaterManager;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Application.Interfaces.IThirdPersonServices;

namespace Cinema.Application.UseCases.TheaterManager.MovieSchedules;

public class DeleteMovieScheduleUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMovieScheduleRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly IAuditLogService _auditLogService;
    private readonly IMovieCacheService _cacheService;

    public DeleteMovieScheduleUseCase(
        IMovieScheduleRepository repository,
        IUserContextService userContextService,
        IAuditLogService _auditLogService,
        IUnitOfWork unitOfWork,
        IMovieCacheService cacheService)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _userContextService = userContextService;
        this._auditLogService = _auditLogService;
        _cacheService = cacheService;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(Guid itemId)
    {
        var getCurrentUserId = _userContextService.GetUserId();
        var schedule = await _repository.GetScheduleByIdWithAuditoriumAsync(itemId);
            
        if (schedule == null)
        {
            throw new NotFoundException(Messages.Schedule.SchedulesIsNotFoundOrMovieIsInactivated);
        }

        if (schedule.IsDeleted)
        {
            throw new BadRequestException("Lịch chiếu này đã bị xóa.", "D01");
        }

        var hasSuccessfulBooking = await _repository.HasSuccessfulBookingForScheduleAsync(itemId);

        if (hasSuccessfulBooking)
        {
            throw new BadRequestException("Không thể xóa lịch chiếu đã có người đặt vé thành công.", "D03");
        }

        schedule.IsDeleted = true;
        schedule.DeletedByUserId = getCurrentUserId;
        schedule.DeletedAt = DateTime.UtcNow;
        
        _repository.UpdateSchedule(schedule);
        await _auditLogService.WriteAsync(
            "Delete",
            "MovieSchedule",
            schedule.MovieScheduleInfoId,
            schedule.MovieInfoEntity!.MovieName,
            $"Deleted schedule for movie {schedule.MovieInfoEntity!.MovieName}.",
            schedule.AuditoriumInfoEntities!.CinemaId);
        await _unitOfWork.SaveChangesAsync();

        try
        {
            await _cacheService.ClearMovieCatalogCacheAsync();
        }
        catch
        {
        }

        return new BaseResponse<string>()
        {
            Message = "Xóa lịch chiếu thành công.",
            Data = null,
            IsSuccess = true
        };
    }
}
