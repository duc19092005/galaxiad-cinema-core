using Cinema.Application.Interfaces.TheaterManager;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager.MovieSchedules;

public class SetScheduleInactiveUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMovieScheduleRepository _repository;
    private readonly ILogger<SetScheduleInactiveUseCase> _logger;

    public SetScheduleInactiveUseCase(
        IMovieScheduleRepository repository,
        ILogger<SetScheduleInactiveUseCase> logger,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _logger = logger;
    }

    public async Task<bool> ExecuteAsync(Guid scheduleId)
    {
        var findSchedule = await _repository.FindScheduleAsync(scheduleId);
        if (findSchedule == null)
        {
            _logger.LogWarning("Schedule {ScheduleId} not found for deactivation", scheduleId);
            return false;
        }

        try
        {
            findSchedule.IsActive = false;
            _repository.UpdateSchedule(findSchedule);
            await _unitOfWork.SaveChangesAsync();
            _logger.LogInformation("Schedule {ScheduleId} deactivated (IsActive=false)", scheduleId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating Movie Schedule {ScheduleId}", scheduleId);
            return false;
        }
    }
}

