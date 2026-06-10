using DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.MovieManager;

/// <summary>
/// Handler được Hangfire gọi để bật/tắt trạng thái suất chiếu theo lịch.
/// </summary>
public class ScheduleStatusJob
{
    private readonly CinemaDbContext _dbContext;
    private readonly ILogger<ScheduleStatusJob> _logger;

    public ScheduleStatusJob(CinemaDbContext dbContext, ILogger<ScheduleStatusJob> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task SetActive(Guid scheduleId)
    {
        var schedule = await _dbContext.MovieScheduleInfoEntity
            .FirstOrDefaultAsync(x => x.MovieScheduleInfoId == scheduleId);
        if (schedule == null)
        {
            _logger.LogError("Can't find schedule {ScheduleId} to activate", scheduleId);
            return;
        }
        schedule.IsActive = true;
        await _dbContext.SaveChangesAsync();
    }

    public async Task SetInactive(Guid scheduleId)
    {
        var schedule = await _dbContext.MovieScheduleInfoEntity
            .FirstOrDefaultAsync(x => x.MovieScheduleInfoId == scheduleId);
        if (schedule == null)
        {
            _logger.LogError("Can't find schedule {ScheduleId} to deactivate", scheduleId);
            return;
        }
        schedule.IsActive = false;
        await _dbContext.SaveChangesAsync();
    }
}
