using Cinema.Application.Interfaces.Facilities;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
using Cinema.Domain.Utils;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Persistence.Repositories.Common;

public class CommonFacilityQueries : ICommonFacilityQueries
{
    private readonly CinemaDbContext _dbContext;

    public CommonFacilityQueries(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<MovieScheduleInfoEntity>> GetActiveSchedulesByAuditoriumIdAsync(Guid auditoriumId)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .Where(s => s.AuditoriumId == auditoriumId && !s.IsDeleted)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task CancelPendingOrdersForScheduleAsync(Guid scheduleId)
    {
        var pendingOrders = await _dbContext.Set<OrderInfoEntity>()
            .Include(o => o.OrderDetailsInfo)
            .Where(o => o.OrderDetailsInfo.Any(od => od.MovieScheduleId == scheduleId)
                        && o.OrderStatus == OrderStatusEnum.Pending)
            .ToListAsync();

        var releasedAt = DateTime.UtcNow;
        foreach (var order in pendingOrders)
        {
            order.OrderStatus = OrderStatusEnum.Canceled;
            foreach (var detail in order.OrderDetailsInfo)
                detail.ReleasedAt ??= releasedAt;
        }
    }

    public async Task<List<CinemaShiftScheduleEntity>> GetActiveShiftSchedulesForCinemaAndDepartmentAsync(Guid cinemaId, Guid departmentId, DateTime date)
    {
        var dateOnly = date.Date;
        var startUtcLimit = dateOnly.AddDays(-1);
        var endUtcLimit = dateOnly.AddDays(1);

        var rawList = await _dbContext.Set<CinemaShiftScheduleEntity>()
            .Include(s => s.RoleListInfoEntity)
            .Include(s => s.DepartmentEntity)
            .Include(s => s.StaffShiftRegistrationEntities)
            .Where(s => s.CinemaId == cinemaId
                     && s.DepartmentId == departmentId
                     && s.Date >= startUtcLimit
                     && s.Date <= endUtcLimit
                     && s.IsActive
                     && s.DeletionStatus == "Active")
            .AsNoTracking()
            .ToListAsync();

        return rawList.Where(s =>
        {
            var utcStart = s.Date.Date + s.StartTime;
            var localStart = DateTimeHelper.ToVietnamTime(utcStart);
            return localStart.Date == dateOnly;
        }).ToList();
    }
}
