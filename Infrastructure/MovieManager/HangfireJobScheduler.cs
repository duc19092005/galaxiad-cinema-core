using Application.Common;
using DataAccess;
using DataAccess.Entities.ScheduleJob;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Shared.Enums;

namespace Infrastructure.MovieManager;

/// <summary>
/// Adapter lên lịch job nền dùng Hangfire (thay cho ScheduleJobsService cũ).
/// Ghi log job vào BackGroundJobLoggerEntity và đăng ký job đổi trạng thái theo mốc thời gian.
/// </summary>
public class HangfireJobScheduler : IBackgroundJobScheduler
{
    private readonly CinemaDbContext _dbContext;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<HangfireJobScheduler> _logger;

    public HangfireJobScheduler(
        CinemaDbContext dbContext,
        IBackgroundJobClient backgroundJobClient,
        ILogger<HangfireJobScheduler> logger)
    {
        _dbContext = dbContext;
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
    }

    public async Task ScheduleStatusJobsAsync(
        BackgroundJobTarget target, Guid targetId, DateTime start, DateTime end,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var (startJobId, endJobId) = RegisterJobs(target, targetId, start, end);
            var category = target == BackgroundJobTarget.Movie
                ? SchedulesJobCategoryEnums.Movies
                : SchedulesJobCategoryEnums.Schedules;

            var logs = new List<ScheduleJobLogger>();
            if (!string.IsNullOrEmpty(startJobId))
            {
                logs.Add(new ScheduleJobLogger
                {
                    JobId = startJobId,
                    TargetId = targetId,
                    StartedTime = start,
                    ScheduleJobStatusType = ScheduleJobStatusType.StartSchedule,
                    SchedulesJobStatus = SchedulesJobStatusEnums.Pending,
                    JobCategory = category
                });
            }
            if (!string.IsNullOrEmpty(endJobId))
            {
                logs.Add(new ScheduleJobLogger
                {
                    JobId = endJobId,
                    TargetId = targetId,
                    StartedTime = end,
                    ScheduleJobStatusType = ScheduleJobStatusType.EndSchedule,
                    SchedulesJobStatus = SchedulesJobStatusEnums.Pending,
                    JobCategory = category
                });
            }

            if (logs.Count > 0)
            {
                await _dbContext.BackGroundJobLoggerEntity.AddRangeAsync(logs, cancellationToken);
                await _dbContext.SaveChangesAsync(cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scheduling status jobs for {TargetId}", targetId);
            throw;
        }
    }

    public async Task RescheduleStatusJobsAsync(
        BackgroundJobTarget target, Guid targetId, DateTime? start, DateTime? end,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Lấy mốc thời gian mới nhất từ DB để job khớp với dữ liệu thực.
            DateTime finalStart = DateTime.MinValue;
            DateTime finalEnd = DateTime.MinValue;

            if (target == BackgroundJobTarget.Movie)
            {
                var movie = await _dbContext.MovieInfoEntity.AsNoTracking()
                    .FirstOrDefaultAsync(x => x.MovieId == targetId, cancellationToken);
                if (movie != null)
                {
                    finalStart = movie.ActiveAt;
                    finalEnd = movie.EndedDate;
                }
            }
            else
            {
                var schedule = await _dbContext.MovieScheduleInfoEntity.AsNoTracking()
                    .FirstOrDefaultAsync(x => x.MovieScheduleInfoId == targetId, cancellationToken);
                if (schedule != null)
                {
                    finalStart = schedule.ActiveAt;
                    finalEnd = schedule.EndedTime;
                }
            }

            if (finalStart == DateTime.MinValue && finalEnd == DateTime.MinValue)
            {
                return;
            }

            // Xoá job Hangfire cũ + log.
            var existing = await _dbContext.BackGroundJobLoggerEntity
                .Where(x => x.TargetId == targetId).ToListAsync(cancellationToken);
            if (existing.Count > 0)
            {
                foreach (var job in existing)
                {
                    if (!string.IsNullOrEmpty(job.JobId) && !job.JobId.StartsWith("SKIPPED_"))
                    {
                        _backgroundJobClient.Delete(job.JobId);
                    }
                }
                _dbContext.BackGroundJobLoggerEntity.RemoveRange(existing);
                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            await ScheduleStatusJobsAsync(target, targetId, finalStart, finalEnd, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rescheduling status jobs for {TargetId}", targetId);
            throw;
        }
    }

    private (string startJobId, string endJobId) RegisterJobs(
        BackgroundJobTarget target, Guid targetId, DateTime start, DateTime end)
    {
        var startId = string.Empty;
        var endId = string.Empty;
        var localStart = DateTime.SpecifyKind(start, DateTimeKind.Local);
        var localEnd = DateTime.SpecifyKind(end, DateTimeKind.Local);
        var tolerance = DateTime.Now.AddSeconds(-20);

        if (target == BackgroundJobTarget.Movie)
        {
            if (localStart > tolerance)
                startId = _backgroundJobClient.Schedule<MovieStatusJob>(j => j.SetActive(targetId), localStart);
            if (localEnd > tolerance)
                endId = _backgroundJobClient.Schedule<MovieStatusJob>(j => j.SetInactive(targetId), localEnd);
        }
        else
        {
            if (localStart > tolerance)
                startId = _backgroundJobClient.Schedule<ScheduleStatusJob>(j => j.SetActive(targetId), localStart);
            if (localEnd > tolerance)
                endId = _backgroundJobClient.Schedule<ScheduleStatusJob>(j => j.SetInactive(targetId), localEnd);
        }

        return (startId, endId);
    }
}
