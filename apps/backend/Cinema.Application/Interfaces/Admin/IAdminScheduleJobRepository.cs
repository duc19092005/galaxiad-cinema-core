using Cinema.Domain.Entities.ScheduleJob;

namespace Cinema.Application.Interfaces.Admin;

public interface IAdminScheduleJobRepository
{
    Task<List<ScheduleJobLogger>> GetScheduleJobsAsync();
}
