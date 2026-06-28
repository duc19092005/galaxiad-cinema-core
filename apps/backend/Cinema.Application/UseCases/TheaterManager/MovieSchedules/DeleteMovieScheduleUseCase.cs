using Cinema.Application.Dtos;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.Interfaces.TheaterManager;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

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
        IAuditLogService auditLogService,
        IUnitOfWork unitOfWork,
        IMovieCacheService cacheService)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _userContextService = userContextService;
        _auditLogService = auditLogService;
        _cacheService = cacheService;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(Guid itemId)
    {
        var currentUserId = _userContextService.GetUserId();
        var schedule = await _repository.GetScheduleByIdWithAuditoriumAsync(itemId);

        if (schedule == null)
        {
            throw new NotFoundException(Messages.Schedule.SchedulesIsNotFoundOrMovieIsInactivated);
        }

        if (schedule.IsDeleted)
        {
            throw new BadRequestException(Messages.Schedule.ScheduleAlreadyDeleted, "D01");
        }

        var hasSuccessfulBooking = await _repository.HasSuccessfulBookingForScheduleAsync(itemId);
        if (hasSuccessfulBooking)
        {
            throw new BadRequestException(Messages.Schedule.CannotDeleteBookedShowtime, "D03");
        }

        schedule.IsDeleted = true;
        schedule.DeletedByUserId = currentUserId;
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

        return new BaseResponse<string>
        {
            Message = Messages.Schedule.MovieScheduleDeleted,
            Data = null,
            IsSuccess = true
        };
    }
}
