using System;
using System.Threading.Tasks;
using Shared.Enums;

namespace BusinessLayer.Interfaces.IThirdPersonServices;

public interface IScheduleJobsService
{
    Task<string> AddJobIntoBackground(SchedulesJobCategoryEnums enums, Guid jobId, DateTime startedTime, DateTime endedTime);
    Task<bool> UpdatedJobIntoBackground(SchedulesJobCategoryEnums typeOfJob , Guid targetId, DateTime? updatedStartedTime , DateTime ?endedTime);
    Task SyncSeededJobs();
}
