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
    Task<string> AddJobIntoBackground(SchedulesJobCategoryEnums enums, Guid jobId, DateTime startedTime,
    DateTime endedTime);
    Task<bool> UpdatedJobIntoBackground(SchedulesJobCategoryEnums typeOfJob , Guid targetId, DateTime? updatedStartedTime , DateTime ?endedTime);
    Task SyncSeededJobs();
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

    private (string startJobId, string endJobId) RegisterHangfireJobs(SchedulesJobCategoryEnums type, Guid targetId, DateTime start, DateTime end)
    {
        string sId = string.Empty;
        string eId = string.Empty;
        var toleranceTime = DateTime.Now.AddSeconds(-20);

        if (type == SchedulesJobCategoryEnums.Movies)
        {
            if (start > toleranceTime)
                sId = _backgroundJobClient.Schedule<WriteMovieInfosUseCase>(u => u.UpdatedComingMovieStatusJobs(targetId), start);
        
            if (end > toleranceTime)
                eId = _backgroundJobClient.Schedule<WriteMovieInfosUseCase>(u => u.UpdatedOverDueStatus(targetId), end);
        }
        else if (type == SchedulesJobCategoryEnums.Schedules)
        {
            // Schedules should be set to inactive when they END
            if (end > toleranceTime)
                eId = _backgroundJobClient.Schedule<WriteMovieSchedulesUseCase>(u => u.SetScheduleStatus(targetId), end);
        }
        return (sId, eId);
    }

    public async Task<string> AddJobIntoBackground(SchedulesJobCategoryEnums type, Guid targetId, DateTime start, DateTime end)
    {
        try
        {
            var ids = RegisterHangfireJobs(type, targetId, start, end);

            var logs = new List<ScheduleJobLogger>();
            
            // Start Job Log
            logs.Add(new ScheduleJobLogger 
            { 
                JobId = string.IsNullOrEmpty(ids.startJobId) ? $"SKIPPED_START_{Guid.NewGuid()}" : ids.startJobId, 
                TargetId = targetId, 
                StartedTime = start, 
                ScheduleJobStatusType = ScheduleJobStatusType.StartSchedule, 
                SchedulesJobStatus = string.IsNullOrEmpty(ids.startJobId) ? SchedulesJobStatusEnums.Completed : SchedulesJobStatusEnums.Pending, 
                JobCategory = type 
            });

            // End Job Log
            logs.Add(new ScheduleJobLogger 
            { 
                JobId = string.IsNullOrEmpty(ids.endJobId) ? $"SKIPPED_END_{Guid.NewGuid()}" : ids.endJobId, 
                TargetId = targetId, 
                StartedTime = end, 
                ScheduleJobStatusType = ScheduleJobStatusType.EndSchedule, 
                SchedulesJobStatus = string.IsNullOrEmpty(ids.endJobId) ? SchedulesJobStatusEnums.Completed : SchedulesJobStatusEnums.Pending, 
                JobCategory = type 
            });

            await _cinemaDbContext.BackGroundJobLoggerEntity.AddRangeAsync(logs);
            await _cinemaDbContext.SaveChangesAsync();
            return "OK";
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error adding background jobs for {TargetId}", targetId);
            throw;
        }
    }

    public async Task<bool> UpdatedJobIntoBackground(SchedulesJobCategoryEnums type, Guid targetId, DateTime? start, DateTime? end)
    {
        var existingJobs = await _cinemaDbContext.BackGroundJobLoggerEntity
            .Where(x => x.TargetId == targetId).ToListAsync();

        if (!existingJobs.Any())
        {
            // ... (keep the same "healing" logic for missing jobs)
            DateTime finalStartHealing = start ?? DateTime.MinValue;
            DateTime finalEndHealing = end ?? DateTime.MinValue;

            if (start == null || end == null)
            {
                if (type == SchedulesJobCategoryEnums.Movies)
                {
                    var movie = await _cinemaDbContext.MovieInfoEntity.FindAsync(targetId);
                    if (movie != null)
                    {
                        finalStartHealing = start ?? movie.ActiveAt;
                        finalEndHealing = end ?? movie.EndedDate;
                    }
                }
                else if (type == SchedulesJobCategoryEnums.Schedules)
                {
                    var schedule = await _cinemaDbContext.MovieScheduleInfoEntity.FindAsync(targetId);
                    if (schedule != null)
                    {
                        finalStartHealing = start ?? schedule.ActiveAt;
                        finalEndHealing = end ?? schedule.EndedTime;
                    }
                }
            }

            if (finalStartHealing != DateTime.MinValue && finalEndHealing != DateTime.MinValue)
            {
                await AddJobIntoBackground(type, targetId, finalStartHealing, finalEndHealing);
                return true;
            }

            return false;
        }

        try
        {
            // 1. Delete Hangfire Jobs
            foreach (var job in existingJobs)
            {
                if (!string.IsNullOrEmpty(job.JobId) && !job.JobId.StartsWith("SKIPPED_"))
                    _backgroundJobClient.Delete(job.JobId);
            }

            // 2. We can't update PK (JobId) in EF Core easily. 
            // So we delete the old logs and add new ones.
            DateTime finalStart = start ?? existingJobs.FirstOrDefault(x => x.ScheduleJobStatusType == ScheduleJobStatusType.StartSchedule)?.StartedTime ?? DateTime.MinValue;
            DateTime finalEnd = end ?? existingJobs.FirstOrDefault(x => x.ScheduleJobStatusType == ScheduleJobStatusType.EndSchedule)?.StartedTime ?? DateTime.MinValue;

            _cinemaDbContext.BackGroundJobLoggerEntity.RemoveRange(existingJobs);
            await _cinemaDbContext.SaveChangesAsync();

            await AddJobIntoBackground(type, targetId, finalStart, finalEnd);
            
            return true;
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error updating background jobs for {TargetId}", targetId);
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    public async Task SyncSeededJobs()
    {
        var movies = await _cinemaDbContext.MovieInfoEntity.ToListAsync();
        foreach (var movie in movies)
        {
            var hasJobs = await _cinemaDbContext.BackGroundJobLoggerEntity.AnyAsync(x => x.TargetId == movie.MovieId);
            if (!hasJobs)
            {
                await AddJobIntoBackground(SchedulesJobCategoryEnums.Movies, movie.MovieId, movie.ActiveAt, movie.EndedDate);
            }
        }

        var schedules = await _cinemaDbContext.MovieScheduleInfoEntity.ToListAsync();
        foreach (var schedule in schedules)
        {
            var hasJobs = await _cinemaDbContext.BackGroundJobLoggerEntity.AnyAsync(x => x.TargetId == schedule.MovieScheduleInfoId);
            if (!hasJobs)
            {
                await AddJobIntoBackground(SchedulesJobCategoryEnums.Schedules, schedule.MovieScheduleInfoId, schedule.ActiveAt, schedule.EndedTime);
            }
        }
    }
}
