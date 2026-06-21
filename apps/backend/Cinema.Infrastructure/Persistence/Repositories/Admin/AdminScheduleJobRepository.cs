using Cinema.Application.Interfaces.Admin;
using Cinema.Domain.Entities.ScheduleJob;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Repositories;

public class AdminScheduleJobRepository : IAdminScheduleJobRepository
{
    private readonly CinemaDbContext _dbContext;

    public AdminScheduleJobRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<ScheduleJobLogger>> GetScheduleJobsAsync()
    {
        return await _dbContext.Set<ScheduleJobLogger>()
            .OrderByDescending(x => x.StartedTime)
            .ToListAsync();
    }
}
