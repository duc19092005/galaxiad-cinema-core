using Cinema.Application.Interfaces.TheaterManager;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.TheaterManager.MovieSchedules;

public class SetScheduleActiveUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMovieScheduleRepository _repository;
    private readonly ILogger<SetScheduleActiveUseCase> _logger;

    public SetScheduleActiveUseCase(
        IMovieScheduleRepository repository,
        ILogger<SetScheduleActiveUseCase> logger,
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
            _logger.LogWarning("Schedule {ScheduleId} not found for activation", scheduleId);
            return false;
        }

        try
        {
            findSchedule.IsActive = true;
            _repository.UpdateSchedule(findSchedule);
            await _unitOfWork.SaveChangesAsync();
            _logger.LogInformation("Schedule {ScheduleId} activated (IsActive=true)", scheduleId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating Movie Schedule {ScheduleId}", scheduleId);
            return false;
        }
    }
}
