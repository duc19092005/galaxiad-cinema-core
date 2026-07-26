using Cinema.Application.Interfaces.Cleaning;
using Cinema.Domain.Constants;
using Cinema.Domain.Entities.Cleaning;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Persistence.Repositories.Cleaning;

public class CleaningRepository : ICleaningRepository
{
    private readonly CinemaDbContext _dbContext;

    public CleaningRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CleaningTaskEntity?> GetTaskByIdAsync(Guid taskId)
    {
        return await _dbContext.Set<CleaningTaskEntity>()
            .Include(t => t.AuditoriumInfoEntities)
            .Include(t => t.AssignedStaff)
                .ThenInclude(s => s!.UserInfoEntity)
            .FirstOrDefaultAsync(t => t.CleaningTaskId == taskId);
    }

    public async Task<List<CleaningTaskEntity>> GetTasksByCinemaAsync(Guid cinemaId, DateTime? date, CleaningTaskStatus? status)
    {
        var query = _dbContext.Set<CleaningTaskEntity>()
            .Include(t => t.AuditoriumInfoEntities)
            .Include(t => t.AssignedStaff)
                .ThenInclude(s => s!.UserInfoEntity)
            .Where(t => t.CinemaId == cinemaId);

        if (date.HasValue)
        {
            var dayStart = date.Value.Date;
            var dayEnd = dayStart.AddDays(1);
            query = query.Where(t => t.ScheduledAt >= dayStart && t.ScheduledAt < dayEnd);
        }

        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
        }

        return await query.OrderBy(t => t.AuditoriumId).ThenBy(t => t.ScheduledAt).ToListAsync();
    }

    public async Task<List<CleaningTaskEntity>> GetTasksByStaffAsync(Guid staffId, DateTime? date)
    {
        var query = _dbContext.Set<CleaningTaskEntity>()
            .Include(t => t.AuditoriumInfoEntities)
            .Where(t => t.AssignedStaffId == staffId);

        if (date.HasValue)
        {
            var dayStart = date.Value.Date;
            var dayEnd = dayStart.AddDays(1);
            query = query.Where(t => t.ScheduledAt >= dayStart && t.ScheduledAt < dayEnd);
        }

        return await query.OrderBy(t => t.ScheduledAt).ToListAsync();
    }

    public async Task<List<CleaningTaskEntity>> GetTasksByAuditoriumAndScheduleAsync(Guid auditoriumId, Guid movieScheduleId)
    {
        return await _dbContext.Set<CleaningTaskEntity>()
            .Where(t => t.AuditoriumId == auditoriumId && t.MovieScheduleId == movieScheduleId)
            .ToListAsync();
    }

    public async Task AddTaskAsync(CleaningTaskEntity task)
    {
        await _dbContext.Set<CleaningTaskEntity>().AddAsync(task);
    }

    public async Task AddTasksRangeAsync(IEnumerable<CleaningTaskEntity> tasks)
    {
        await _dbContext.Set<CleaningTaskEntity>().AddRangeAsync(tasks);
    }

    public void UpdateTask(CleaningTaskEntity task)
    {
        _dbContext.Set<CleaningTaskEntity>().Update(task);
    }

    public async Task<bool> IsActiveJanitorAtCinemaAsync(Guid staffId, Guid cinemaId)
    {
        return await _dbContext.Set<StaffProfileEntity>()
            .AnyAsync(profile =>
                profile.UserId == staffId
                && profile.CinemaId == cinemaId
                && profile.WorkingStatus
                && profile.UserInfoEntity.UserRoleInfoEntity.Any(role => role.RoleId == userRoles.Janitor));
    }
    /// <summary>
    /// Chỉ cho phép nhân viên quét dọn scan check-in/check-out khi họ đang trong một ca
    /// Approved bao trùm thời điểm hiện tại. Việc này ngăn nhân viên không trong ca trực
    /// tự ý nhận nhiệm vụ dọn dẹp.
    /// </summary>
    public async Task<bool> HasApprovedShiftNowAsync(Guid staffId, DateTime atTime)
    {
        var dateOnly = atTime.Date;
        var timeOfDay = atTime.TimeOfDay;

        var registrations = await _dbContext.Set<StaffShiftRegistrationEntity>()
            .Include(r => r.CinemaShiftTemplateEntity)
            .Include(r => r.CinemaShiftScheduleEntity)
            .Where(r => r.StaffId == staffId && r.RegistrationDate == dateOnly && r.Status == "Approved")
            .ToListAsync();

        foreach (var reg in registrations)
        {
            TimeSpan? start = reg.CinemaShiftTemplateEntity?.StartTime ?? reg.CinemaShiftScheduleEntity?.StartTime;
            TimeSpan? end = reg.CinemaShiftTemplateEntity?.EndTime ?? reg.CinemaShiftScheduleEntity?.EndTime;

            if (!start.HasValue || !end.HasValue) continue;

            bool withinShift = start.Value <= end.Value
                ? timeOfDay >= start.Value && timeOfDay <= end.Value
                : timeOfDay >= start.Value || timeOfDay <= end.Value;

            if (withinShift) return true;
        }

        return false;
    }

    public async Task<List<MovieScheduleInfoEntity>> GetSchedulesEndingInRangeAsync(Guid cinemaId, DateTime fromDate, DateTime toDate)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .Include(s => s.AuditoriumInfoEntities)
            .Where(s => s.AuditoriumInfoEntities != null
                        && s.AuditoriumInfoEntities.CinemaId == cinemaId
                        && s.EndedTime >= fromDate
                        && s.EndedTime <= toDate)
            .OrderBy(s => s.AuditoriumId).ThenBy(s => s.StartTime)
            .ToListAsync();
    }
}
