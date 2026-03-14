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
        
        // Treat incoming dates as the absolute reference (Vietnam Time)
        // We force Kind to Utc so Hangfire doesn't try to shift it based on server local time.
        // Actually, Hangfire stores everything as UTC. If we want it to run at 9:44 AM Vietnam, 
        // and our server is +7, we should pass 2:44 AM UTC.
        // BUT, since we want to be pragmatic: we'll convert everything to Local kind and let Hangfire handle it.
        var localStart = DateTime.SpecifyKind(start, DateTimeKind.Local);
        var localEnd = DateTime.SpecifyKind(end, DateTimeKind.Local);
        var toleranceTime = DateTime.Now.AddSeconds(-20);

        if (type == SchedulesJobCategoryEnums.Movies)
        {
            if (localStart > toleranceTime)
                sId = _backgroundJobClient.Schedule<WriteMovieInfosUseCase>(u => u.UpdatedComingMovieStatusJobs(targetId), localStart);
        
            if (localEnd > toleranceTime)
                eId = _backgroundJobClient.Schedule<WriteMovieInfosUseCase>(u => u.UpdatedOverDueStatus(targetId), localEnd);
        }
        else if (type == SchedulesJobCategoryEnums.Schedules)
        {
            if (localEnd > toleranceTime)
                eId = _backgroundJobClient.Schedule<WriteMovieSchedulesUseCase>(u => u.SetScheduleStatus(targetId), localEnd);
        }
        return (sId, eId);
    }

    public async Task<string> AddJobIntoBackground(SchedulesJobCategoryEnums type, Guid targetId, DateTime start, DateTime end)
    {
        try
        {
            var ids = RegisterHangfireJobs(type, targetId, start, end);

            var logs = new List<ScheduleJobLogger>();
            
            // Only create log if a JobId was actually returned by Hangfire
            if (!string.IsNullOrEmpty(ids.startJobId))
            {
                logs.Add(new ScheduleJobLogger 
                { 
                    JobId = ids.startJobId, 
                    TargetId = targetId, 
                    StartedTime = start, 
                    ScheduleJobStatusType = ScheduleJobStatusType.StartSchedule, 
                    SchedulesJobStatus = SchedulesJobStatusEnums.Pending, 
                    JobCategory = type 
                });
            }

            if (!string.IsNullOrEmpty(ids.endJobId))
            {
                logs.Add(new ScheduleJobLogger 
                { 
                    JobId = ids.endJobId, 
                    TargetId = targetId, 
                    StartedTime = end, 
                    ScheduleJobStatusType = ScheduleJobStatusType.EndSchedule, 
                    SchedulesJobStatus = SchedulesJobStatusEnums.Pending, 
                    JobCategory = type 
                });
            }

            if (logs.Any())
            {
                await _cinemaDbContext.BackGroundJobLoggerEntity.AddRangeAsync(logs);
                await _cinemaDbContext.SaveChangesAsync();
            }
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
        try
        {
            // 1. Fetch the MOST UP-TO-DATE information from DB
            // We ignore the 'start' and 'end' parameters if they are missing, 
            // ensuring the background job matches exactly what is stored.
            DateTime finalStart = DateTime.MinValue;
            DateTime finalEnd = DateTime.MinValue;

            if (type == SchedulesJobCategoryEnums.Movies)
            {
                var movie = await _cinemaDbContext.MovieInfoEntity.AsNoTracking().FirstOrDefaultAsync(x => x.MovieId == targetId);
                if (movie != null)
                {
                    finalStart = movie.ActiveAt;
                    finalEnd = movie.EndedDate;
                }
            }
            else if (type == SchedulesJobCategoryEnums.Schedules)
            {
                var schedule = await _cinemaDbContext.MovieScheduleInfoEntity.AsNoTracking().FirstOrDefaultAsync(x => x.MovieScheduleInfoId == targetId);
                if (schedule != null)
                {
                    finalStart = schedule.ActiveAt;
                    finalEnd = schedule.EndedTime;
                }
            }

            if (finalStart == DateTime.MinValue && finalEnd == DateTime.MinValue) return false;

            // 2. Delete Existing Hangfire Jobs
            var existingJobs = await _cinemaDbContext.BackGroundJobLoggerEntity
                .Where(x => x.TargetId == targetId).ToListAsync();

            if (existingJobs.Any())
            {
                foreach (var job in existingJobs)
                {
                    if (!string.IsNullOrEmpty(job.JobId) && !job.JobId.StartsWith("SKIPPED_"))
                        _backgroundJobClient.Delete(job.JobId);
                }
                _cinemaDbContext.BackGroundJobLoggerEntity.RemoveRange(existingJobs);
                await _cinemaDbContext.SaveChangesAsync();
            }

            // 3. Register Brand New Jobs based on DB truth
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
        var now = DateTime.Now;

        // 1. HARD RESET: Clear the entire logger table AND Hangfire pending jobs
        // This stops "ghost" jobs from running after the logs are gone.
        var allLogs = await _cinemaDbContext.BackGroundJobLoggerEntity.ToListAsync();
        if (allLogs.Any())
        {
            foreach (var log in allLogs)
            {
                if (!log.JobId.StartsWith("SKIPPED_"))
                {
                    _backgroundJobClient.Delete(log.JobId);
                }
            }
            _cinemaDbContext.BackGroundJobLoggerEntity.RemoveRange(allLogs);
            await _cinemaDbContext.SaveChangesAsync();
        }

        // 2. Process Movies: Only sync movies that haven't ended yet
        var movies = await _cinemaDbContext.MovieInfoEntity
            .Where(m => m.EndedDate > now)
            .ToListAsync();

        foreach (var movie in movies)
        {
            await AddJobIntoBackground(SchedulesJobCategoryEnums.Movies, movie.MovieId, movie.ActiveAt, movie.EndedDate);
        }

        // 3. Process Schedules: Only sync showtimes that haven't ended yet
        var schedules = await _cinemaDbContext.MovieScheduleInfoEntity
            .Where(s => s.EndedTime > now)
            .ToListAsync();

        foreach (var schedule in schedules)
        {
            await AddJobIntoBackground(SchedulesJobCategoryEnums.Schedules, schedule.MovieScheduleInfoId, schedule.ActiveAt, schedule.EndedTime);
        }
    }
}
