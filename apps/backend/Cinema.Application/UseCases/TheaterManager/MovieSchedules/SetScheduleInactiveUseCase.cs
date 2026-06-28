using Cinema.Application.Interfaces.TheaterManager;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;
using Cinema.Application.Interfaces.IThirdPersonServices;
using System;
using System.Threading.Tasks;

namespace Cinema.Application.UseCases.TheaterManager.MovieSchedules;

public class SetScheduleInactiveUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMovieScheduleRepository _repository;
    private readonly ILogger<SetScheduleInactiveUseCase> _logger;
    private readonly IMovieCacheService _cacheService;

    public SetScheduleInactiveUseCase(
        IMovieScheduleRepository repository,
        ILogger<SetScheduleInactiveUseCase> logger,
        IUnitOfWork unitOfWork,
        IMovieCacheService cacheService)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _logger = logger;
        _cacheService = cacheService;
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

            try
            {
                await _cacheService.ClearMovieCatalogCacheAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to clear movie catalog cache on Redis");
            }

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

