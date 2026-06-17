using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BusinessLayer.UseCases.MovieManager.MovieInfos;
using BusinessLayer.UseCases.TheaterManager.MovieSchedules;
using BusinessLayer.Entities.MovieInfos;
using BusinessLayer.Entities.ScheduleJob;
using BusinessLayer.Interfaces.IThirdPersonServices;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Shared.Enums;
using Shared.Exceptions;
using Shared.Interfaces.Persistence;

namespace DataAccess.Services;

public class ScheduleJobsService : IScheduleJobsService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<ScheduleJobsService> _logger;

    public ScheduleJobsService(IUnitOfWork unitOfWork, ILogger<ScheduleJobsService> logger, IBackgroundJobClient backgroundJobClient)
    {
        _unitOfWork = unitOfWork;
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
    }

    private (string startJobId, string endJobId) RegisterHangfireJobs(SchedulesJobCategoryEnums type, Guid targetId, DateTime start, DateTime end)
    {
        string sId = string.Empty;
        string eId = string.Empty;
        
        // start và end đã là UTC (từ DB), chỉ cần đảm bảo Kind=Utc cho Hangfire
        var utcStart = DateTime.SpecifyKind(start, DateTimeKind.Utc);
        var utcEnd = DateTime.SpecifyKind(end, DateTimeKind.Utc);
        var toleranceTime = DateTime.UtcNow.AddSeconds(-20);

        if (type == SchedulesJobCategoryEnums.Movies)
        {
            if (utcStart > toleranceTime)
                sId = _backgroundJobClient.Schedule<WriteMovieInfosUseCase>(u => u.UpdatedComingMovieStatusJobs(targetId), utcStart);
        
            if (utcEnd > toleranceTime)
                eId = _backgroundJobClient.Schedule<WriteMovieInfosUseCase>(u => u.UpdatedOverDueStatus(targetId), utcEnd);
        }
        else if (type == SchedulesJobCategoryEnums.Schedules)
        {
            if (utcStart > toleranceTime)
                sId = _backgroundJobClient.Schedule<WriteMovieSchedulesUseCase>(u => u.SetScheduleActiveStatus(targetId), utcStart);

            if (utcEnd > toleranceTime)
                eId = _backgroundJobClient.Schedule<WriteMovieSchedulesUseCase>(u => u.SetScheduleInactiveStatus(targetId), utcEnd);
        }
        return (sId, eId);
    }

    public async Task<string> AddJobIntoBackground(SchedulesJobCategoryEnums type, Guid targetId, DateTime start, DateTime end)
    {
        try
        {
            var ids = RegisterHangfireJobs(type, targetId, start, end);

            var logs = new List<ScheduleJobLogger>();
            
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
                await Repository<ScheduleJobLogger>().AddRangeAsync(logs);
                await _unitOfWork.SaveChangesAsync();
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
            DateTime finalStart = DateTime.MinValue;
            DateTime finalEnd = DateTime.MinValue;

            if (type == SchedulesJobCategoryEnums.Movies)
            {
                var movie = await Query<MovieInfoEntity>().AsNoTracking().FirstOrDefaultAsync(x => x.MovieId == targetId);
                if (movie != null)
                {
                    finalStart = movie.ActiveAt;
                    finalEnd = movie.EndedDate;
                }
            }
            else if (type == SchedulesJobCategoryEnums.Schedules)
            {
                var schedule = await Query<MovieScheduleInfoEntity>().AsNoTracking().FirstOrDefaultAsync(x => x.MovieScheduleInfoId == targetId);
                if (schedule != null)
                {
                    finalStart = schedule.ActiveAt;
                    finalEnd = schedule.EndedTime;
                }
            }

            if (finalStart == DateTime.MinValue && finalEnd == DateTime.MinValue) return false;

            var existingJobs = await Query<ScheduleJobLogger>()
                .Where(x => x.TargetId == targetId).ToListAsync();

            if (existingJobs.Any())
            {
                foreach (var job in existingJobs)
                {
                    if (!string.IsNullOrEmpty(job.JobId) && !job.JobId.StartsWith("SKIPPED_"))
                        _backgroundJobClient.Delete(job.JobId);
                }
                Repository<ScheduleJobLogger>().RemoveRange(existingJobs);
                await _unitOfWork.SaveChangesAsync();
            }

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
        var now = DateTime.UtcNow;
        _logger.LogInformation("SyncSeededJobs: Starting full sync at {Now}", now);

        var allLogs = await Query<ScheduleJobLogger>().ToListAsync();
        if (allLogs.Any())
        {
            foreach (var log in allLogs)
            {
                try
                {
                    if (!log.JobId.StartsWith("SKIPPED_"))
                        _backgroundJobClient.Delete(log.JobId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not delete Hangfire job {JobId}", log.JobId);
                }
            }
            Repository<ScheduleJobLogger>().RemoveRange(allLogs);
            await _unitOfWork.SaveChangesAsync();
        }

        try
        {
            await _unitOfWork.ExecuteSqlRawAsync(@"
                IF OBJECT_ID('[HangFire].[Job]', 'U') IS NOT NULL
                BEGIN
                    DELETE FROM [HangFire].[State];
                    DELETE FROM [HangFire].[JobParameter];
                    DELETE FROM [HangFire].[JobQueue];
                    DELETE FROM [HangFire].[Job];
                    DELETE FROM [HangFire].[Counter];
                    DELETE FROM [HangFire].[AggregatedCounter];
                    DELETE FROM [HangFire].[Set];
                    DELETE FROM [HangFire].[Hash];
                    DELETE FROM [HangFire].[List];
                END
            ");
            _logger.LogInformation("SyncSeededJobs: Cleared all Hangfire internal tables (if they existed)");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SyncSeededJobs: Could not clear Hangfire tables");
        }

        var movies = await Query<MovieInfoEntity>()
            .Where(m => m.EndedDate > now && !m.IsDeleted)
            .ToListAsync();

        foreach (var movie in movies)
        {
            if (movie.ActiveAt <= now)
            {
                movie.IsActive = true;
                movie.IsCommingSoon = false;
            }
            else
            {
                movie.IsActive = false;
                movie.IsCommingSoon = true;
            }
            Repository<MovieInfoEntity>().Update(movie);
            
            try 
            {
                await AddJobIntoBackground(SchedulesJobCategoryEnums.Movies, movie.MovieId, movie.ActiveAt, movie.EndedDate);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "SyncSeededJobs: Could not register Hangfire job for movie {MovieId}. This is expected if Hangfire tables don't exist yet on first boot.", movie.MovieId);
            }
        }
        await _unitOfWork.SaveChangesAsync();
        _logger.LogInformation("SyncSeededJobs: Synced and updated status for {Count} movie jobs", movies.Count);

        var schedules = await Query<MovieScheduleInfoEntity>()
            .Where(s => s.EndedTime > now && !s.IsDeleted)
            .ToListAsync();

        foreach (var schedule in schedules)
        {
            if (schedule.StartTime <= now)
            {
                schedule.IsActive = true;
            }
            else
            {
                schedule.IsActive = false;
            }
            Repository<MovieScheduleInfoEntity>().Update(schedule);

            try 
            {
                await AddJobIntoBackground(SchedulesJobCategoryEnums.Schedules, schedule.MovieScheduleInfoId, schedule.ActiveAt, schedule.EndedTime);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "SyncSeededJobs: Could not register Hangfire job for schedule {ScheduleId}.", schedule.MovieScheduleInfoId);
            }
        }
        await _unitOfWork.SaveChangesAsync();
        _logger.LogInformation("SyncSeededJobs: Synced and updated status for {Count} schedule jobs", schedules.Count);
    }

    private IQueryable<TEntity> Query<TEntity>() where TEntity : class
    {
        return Repository<TEntity>().Query();
    }

    private IRepository<TEntity> Repository<TEntity>() where TEntity : class
    {
        return _unitOfWork.Repository<TEntity>();
    }
}
