using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Entities.Vouchers;
using Cinema.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Repositories;

public class BookingOrderRepository : IBookingOrderRepository
{
    private readonly CinemaDbContext _dbContext;

    public BookingOrderRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<DepartmentEntity?> GetDepartmentBySharedUserIdAsync(Guid userId)
    {
        return await _dbContext.Set<DepartmentEntity>()
            .FirstOrDefaultAsync(d => d.SharedUserId == userId);
    }

    public async Task<StaffWorkingLoggerEntity?> GetActiveStaffLoggerAsync(Guid cinemaId)
    {
        return await _dbContext.Set<StaffWorkingLoggerEntity>()
            .Include(l => l.StaffProfileEntity)
            .FirstOrDefaultAsync(l => l.StaffProfileEntity.CinemaId == cinemaId && l.EndedShiftTime == null);
    }

    public async Task<UserInfoEntity?> FindUserByEmailAsync(string email)
    {
        return await _dbContext.Set<UserInfoEntity>()
            .FirstOrDefaultAsync(u => u.UserEmail == email);
    }

    public async Task<MovieScheduleInfoEntity?> GetScheduleByIdAsync(Guid scheduleId)
    {
        return await _dbContext.Set<MovieScheduleInfoEntity>()
            .Include(s => s.MovieFormatInfoEntity)
            .Include(s => s.MovieInfoEntity)
            .Include(s => s.AuditoriumInfoEntities)
            .FirstOrDefaultAsync(s => s.MovieScheduleInfoId == scheduleId && !s.IsDeleted);
    }

    public async Task<List<SeatsInfoEntity>> GetValidSeatsAsync(Guid auditoriumId, List<Guid> seatIds)
    {
        return await _dbContext.Set<SeatsInfoEntity>()
            .Where(s => s.AuditoriumId == auditoriumId && seatIds.Contains(s.SeatId))
            .ToListAsync();
    }

    public async Task<List<Guid>> GetAlreadyBookedSeatsAsync(Guid scheduleId, List<Guid> seatIds)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .Where(od => od.MovieScheduleId == scheduleId
                         && seatIds.Contains(od.SeatId)
                         && (od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Pending
                             || od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked))
            .Select(od => od.SeatId)
            .Distinct()
            .ToListAsync();
    }

    public async Task<List<SeatsInfoEntity>> GetAuditoriumSeatsAsync(Guid auditoriumId)
    {
        return await _dbContext.Set<SeatsInfoEntity>()
            .Where(s => s.AuditoriumId == auditoriumId)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<Guid>> GetOccupiedSeatIdsAsync(Guid scheduleId)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .Where(od => od.MovieScheduleId == scheduleId
                         && (od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Pending
                             || od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked))
            .Select(od => od.SeatId)
            .Distinct()
            .ToListAsync();
    }

    public async Task<CustomerProfileEntity?> GetCustomerProfileAsync(Guid userId)
    {
        return await _dbContext.Set<CustomerProfileEntity>()
            .Include(cp => cp.UserSegmentsInfoEntity)
            .FirstOrDefaultAsync(cp => cp.UserId == userId);
    }

    public async Task<UserVoucherEntity?> GetUserVoucherAsync(Guid voucherId, Guid userId)
    {
        return await _dbContext.Set<UserVoucherEntity>()
            .Include(uv => uv.VoucherInfoEntity)
            .FirstOrDefaultAsync(uv => uv.VoucherId == voucherId && uv.UserId == userId && !uv.IsUsed);
    }

    public async Task<UserInfoEntity?> FindUserByIdAsync(Guid userId)
    {
        return await _dbContext.Set<UserInfoEntity>()
            .FirstOrDefaultAsync(u => u.UserId == userId);
    }

    public async Task AddOrderAsync(OrderInfoEntity order)
    {
        await _dbContext.Set<OrderInfoEntity>().AddAsync(order);
    }

    public async Task AddOrderDetailsRangeAsync(List<OrderDetailsInfo> details)
    {
        await _dbContext.Set<OrderDetailsInfo>().AddRangeAsync(details);
    }

    public async Task<OrderInfoEntity?> GetOrderWithDetailsAsync(Guid orderId)
    {
        return await _dbContext.Set<OrderInfoEntity>()
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(od => od.MovieScheduleInfoEntity!)
                    .ThenInclude(s => s.MovieInfoEntity!)
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(od => od.MovieScheduleInfoEntity!)
                    .ThenInclude(s => s.MovieFormatInfoEntity!)
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(od => od.MovieScheduleInfoEntity!)
                    .ThenInclude(s => s.AuditoriumInfoEntities!)
                        .ThenInclude(a => a.CinemaInfoEntity!)
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(od => od.SeatsInfoEntity!)
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(od => od.UserSegmentsInfoEntity!)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.OrderId == orderId);
    }
}
