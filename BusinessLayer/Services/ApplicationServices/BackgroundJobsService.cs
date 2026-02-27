
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
    Task<string> AddJobIntoBackground(SchedulesJobEnums enums ,Guid jobId,DateTime startedTime);
    Task<bool> UpdatedJobIntoBackground(SchedulesJobEnums typeOfJob , Guid targetId, DateTime? updatedStartedTime);
}
public class ScheduleJobsService : IScheduleJobsService
{
    private readonly CinemaDbContext _cinemaDbContext;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<ScheduleJobsService> _logger;
    public ScheduleJobsService(CinemaDbContext cinemaDbContext , ILogger<ScheduleJobsService> logger , IBackgroundJobClient backgroundJobClient)
    {
        _cinemaDbContext = cinemaDbContext;
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
    }
    public async Task<string> AddJobIntoBackground
        (SchedulesJobEnums typeOfJob ,Guid targetId , DateTime startedTime)
    {
        try
        {
            string currJobId = String.Empty;
            switch (typeOfJob)
            {
                case SchedulesJobEnums.Movies:
                    currJobId = _backgroundJobClient.Schedule<WriteMovieInfosUseCase>(
                        useCase => useCase.UpdatedComingMovieStatusJobs(targetId),
                        startedTime
                    );
                    break;
                
                case SchedulesJobEnums.Schedules:
                    currJobId = _backgroundJobClient.Schedule<WriteMovieSchedulesUseCase>(
                        useCase => useCase.SetScheduleStatus(targetId),
                        startedTime
                    );
                    break;
                default:
                    throw new NotFoundException("");
            }
            
            await _cinemaDbContext.BackGroundJobLoggerEntity.AddAsync(new ScheduleJobLogger()
            {
                JobId = currJobId,
                StartedTime = startedTime,
                FinishedTime = DateTime.MinValue,
                SchedulesJobStatus = SchedulesJobStatusEnums.Pending,
                TargetId = targetId,
                JobCategory = SchedulesJobEnums.Movies
            });
            await _cinemaDbContext.SaveChangesAsync();
            return currJobId;
        }
        catch (Exception e)
        {
            _logger.LogError(e , "Error While Adding Jobs");
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    public bool DeletedJobIntoBackground(Guid jobId)
    {
        return true;
    }

    public async Task<bool> UpdatedJobIntoBackground(SchedulesJobEnums typeOfJob, Guid targetId,
        DateTime? updatedStartedTime)
    {
        if (updatedStartedTime == null)
        {
            return true;
        }else
        {
            var findJob = await _cinemaDbContext.BackGroundJobLoggerEntity.FirstOrDefaultAsync
                (x => x.TargetId == targetId);
            if (findJob == null)
            {
                return false;
            }
            try
            {
                string addingJobId = await AddJobIntoBackground(typeOfJob, targetId, updatedStartedTime 
                    ?? DateTime.MinValue);
        
                if (String.IsNullOrEmpty(addingJobId))
                {
                    return false;
                }
                // Then Updated the Job Id in databases
                findJob.JobId = addingJobId;
            
                // Deleted The Old Job
                _backgroundJobClient.Delete(findJob.JobId);
                _cinemaDbContext.BackGroundJobLoggerEntity.Update(findJob);
                await _cinemaDbContext.SaveChangesAsync();
                return true;
            }
            catch (Exception e)
            {
                _logger.LogError(e , "Error While Updating Jobs");
                throw CustomSystemException.SystemExceptionCaller();
            }
        }
    }
}