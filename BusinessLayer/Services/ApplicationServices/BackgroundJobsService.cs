using BusinessLayer.UseCases.MovieManager.MovieInfos;
using BusinessLayer.UseCases.TheaterManager.MovieSchedules;
using DataAccess;
using DataAccess.Entities.ScheduleJob;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Shared.Enums;
using Shared.Exceptions;

namespace BusinessLayer.Services.ApplicationServices;

public interface IScheduleJobsService
{
    Task<string> AddJobIntoBackground(SchedulesJobEnums enums, Guid jobId, DateTime startedTime,
    DateTime endedTime);
    Task<bool> UpdatedJobIntoBackground(SchedulesJobEnums typeOfJob , Guid targetId, DateTime? updatedStartedTime , DateTime ?endedTime);
}

public class ScheduleJobsService : IScheduleJobsService
{
    private readonly CinemaDbContext _cinemaDbContext;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<ScheduleJobsService> _logger;

    public ScheduleJobsService(CinemaDbContext cinemaDbContext, ILogger<ScheduleJobsService> logger, IBackgroundJobClient backgroundJobClient)
    {
        _cinemaDbContext = cinemaDbContext;
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
    }

    private (string startJobId, string endJobId) RegisterHangfireJobs(SchedulesJobEnums type, Guid targetId, DateTime start, DateTime end)
    {
        string sId = string.Empty;
        string eId = string.Empty;
        var toleranceTime = DateTime.Now.AddSeconds(-20);

        if (type == SchedulesJobEnums.Movies)
        {
            if (start > toleranceTime)
                sId = _backgroundJobClient.Schedule<WriteMovieInfosUseCase>(u => u.UpdatedComingMovieStatusJobs(targetId), start);
        
            if (end > toleranceTime)
                eId = _backgroundJobClient.Schedule<WriteMovieInfosUseCase>(u => u.UpdatedOverDueStatus(targetId), end);
        }
        else if (type == SchedulesJobEnums.Schedules)
        {
            if (start > toleranceTime)
                sId = _backgroundJobClient.Schedule<WriteMovieSchedulesUseCase>(u => u.SetScheduleStatus(targetId), start);
        }
        return (sId, eId);
    }

    public async Task<string> AddJobIntoBackground(SchedulesJobEnums type, Guid targetId, DateTime start, DateTime end)
    {
        try
        {
            var ids = RegisterHangfireJobs(type, targetId, start, end);

            var logs = new List<ScheduleJobLogger>
            {
                new() { JobId = ids.startJobId, TargetId = targetId, StartedTime = start, ScheduleJobStatus = ScheduleJobStatusType.StartSchedule, SchedulesJobStatus = SchedulesJobStatusEnums.Pending, JobCategory = type },
                new() { JobId = ids.endJobId, TargetId = targetId, StartedTime = end, ScheduleJobStatus = ScheduleJobStatusType.EndSchedule, SchedulesJobStatus = SchedulesJobStatusEnums.Pending, JobCategory = type }
            };

            await _cinemaDbContext.BackGroundJobLoggerEntity.AddRangeAsync(logs);
            await _cinemaDbContext.SaveChangesAsync();
            return ids.startJobId;
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error adding background jobs for {TargetId}", targetId);
            throw;
        }
    }

    public async Task<bool> UpdatedJobIntoBackground(SchedulesJobEnums type, Guid targetId, DateTime? start, DateTime? end)
    {
        var existingJobs = await _cinemaDbContext.BackGroundJobLoggerEntity
            .Where(x => x.TargetId == targetId).ToListAsync();

        if (!existingJobs.Any()) return false;

        try
        {
            foreach (var job in existingJobs)
            {
                if (!string.IsNullOrEmpty(job.JobId))
                    _backgroundJobClient.Delete(job.JobId);
            }

            var newIds = RegisterHangfireJobs(type, targetId, start ?? DateTime.MinValue, end ?? DateTime.MinValue);

            foreach (var job in existingJobs)
            {
                if (job.ScheduleJobStatus == ScheduleJobStatusType.StartSchedule)
                {
                    job.JobId = newIds.startJobId;
                    job.StartedTime = start ?? job.StartedTime;
                }
                else
                {
                    job.JobId = newIds.endJobId;
                    job.StartedTime = end ?? job.StartedTime;
                }
                job.SchedulesJobStatus = SchedulesJobStatusEnums.Pending;
            }

            _cinemaDbContext.BackGroundJobLoggerEntity.UpdateRange(existingJobs);
            await _cinemaDbContext.SaveChangesAsync();
            return true;
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error updating background jobs for {TargetId}", targetId);
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
}
